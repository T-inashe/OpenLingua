const { prisma } = require('../lib/prisma');
const { QuizApiClient } = require('./quizApiClient');
const { QuizCacheService } = require('./quizCacheService');

class QuizSharingService {
  constructor() {
    this.apiClient = new QuizApiClient();
    this.cacheService = new QuizCacheService();
  }

  // Share a quiz as a template
  async shareQuizAsTemplate(quizId, instructorId, shareOptions = {}) {
    try {
      // Validate ownership
      const quiz = await prisma.courseQuiz.findFirst({
        where: {
          id: quizId,
          course: { instructorId: instructorId },
          isActive: true
        },
        include: {
          course: { select: { title: true, instructorId: true } }
        }
      });

      if (!quiz) {
        throw new Error('Quiz not found or unauthorized');
      }

      // Get full quiz data (from cache or external API)
      let quizData;
      try {
        const externalData = await this.apiClient.getQuiz(quiz.externalQuizId, quiz.courseId);
        quizData = externalData.data;
      } catch (apiError) {
        const cachedData = await this.cacheService.getCachedQuiz(quizId);
        if (!cachedData) {
          throw new Error('Quiz data not available for sharing');
        }
        quizData = cachedData;
      }

      // Create template record
      const template = await prisma.courseQuiz.create({
        data: {
          courseId: quiz.courseId, // Keep reference to original course
          externalQuizId: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: `${quiz.title} (Template)`,
          description: quiz.description + '\n\n[Shared template]',
          category: quiz.category,
          difficulty: quiz.difficulty,
          tags: [...(quiz.tags || []), 'template', 'shared'],
          isActive: true,
          isTemplate: true,
          sharedByUserId: instructorId,
          isCached: true,
          cachedData: {
            ...quizData,
            metadata: {
              ...quizData.metadata,
              originalQuizId: quizId,
              originalCourse: quiz.course.title,
              sharedBy: instructorId,
              sharedAt: new Date().toISOString(),
              shareOptions: {
                allowModification: shareOptions.allowModification !== false,
                attribution: shareOptions.attribution !== false,
                visibility: shareOptions.visibility || 'public'
              }
            }
          }
        }
      });

      // Log sharing activity
      console.log(`Quiz template created: ${template.title} by instructor ${instructorId}`);

      return {
        success: true,
        template: {
          id: template.id,
          title: template.title,
          description: template.description,
          category: template.category,
          difficulty: template.difficulty,
          questionCount: quizData.questions?.length || 0,
          sharedAt: template.createdAt,
          originalCourse: quiz.course.title
        }
      };

    } catch (error) {
      console.error('Share quiz error:', error);
      throw error;
    }
  }

  // Get available templates for an instructor
  async getAvailableTemplates(instructorId, filters = {}) {
    try {
      const whereClause = {
        isTemplate: true,
        isActive: true,
        OR: [
          { sharedByUserId: instructorId }, // Own templates
          { 
            cachedData: {
              path: ['metadata', 'shareOptions', 'visibility'],
              in: ['public', 'instructors']
            }
          }
        ]
      };

      // Apply filters
      if (filters.category) {
        whereClause.category = filters.category;
      }
      
      if (filters.difficulty) {
        whereClause.difficulty = filters.difficulty;
      }

      if (filters.search) {
        whereClause.OR = [
          ...(whereClause.OR || []),
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const templates = await prisma.courseQuiz.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          difficulty: true,
          tags: true,
          createdAt: true,
          sharedByUserId: true,
          cachedData: true
        },
        orderBy: { createdAt: 'desc' }
      });

      // Format templates for response
      const formattedTemplates = templates.map(template => ({
        id: template.id,
        title: template.title,
        description: template.description,
        category: template.category,
        difficulty: template.difficulty,
        tags: template.tags,
        questionCount: template.cachedData?.questions?.length || 0,
        originalCourse: template.cachedData?.metadata?.originalCourse,
        sharedBy: template.sharedByUserId,
        sharedAt: template.createdAt,
        isOwn: template.sharedByUserId === instructorId,
        allowModification: template.cachedData?.metadata?.shareOptions?.allowModification !== false,
        attribution: template.cachedData?.metadata?.shareOptions?.attribution !== false
      }));

      return {
        success: true,
        templates: formattedTemplates,
        totalCount: formattedTemplates.length
      };

    } catch (error) {
      console.error('Get templates error:', error);
      throw error;
    }
  }

  // Copy template to a course
  async copyTemplateToourse(templateId, targetCourseId, instructorId, customizations = {}) {
    try {
      // Validate instructor owns target course
      const targetCourse = await prisma.course.findFirst({
        where: {
          id: targetCourseId,
          instructorId: instructorId
        }
      });

      if (!targetCourse) {
        throw new Error('Target course not found or unauthorized');
      }

      // Get template
      const template = await prisma.courseQuiz.findFirst({
        where: {
          id: templateId,
          isTemplate: true,
          isActive: true
        }
      });

      if (!template) {
        throw new Error('Template not found');
      }

      // Check if instructor has permission to use this template
      const canUse = template.sharedByUserId === instructorId || 
                    template.cachedData?.metadata?.shareOptions?.visibility === 'public' ||
                    template.cachedData?.metadata?.shareOptions?.visibility === 'instructors';

      if (!canUse) {
        throw new Error('Permission denied to use this template');
      }

      const templateData = template.cachedData;
      
      // Apply customizations
      const quizTitle = customizations.title || template.title.replace(' (Template)', '');
      const quizDescription = customizations.description || template.description.replace('\n\n[Shared template]', '');
      
      let quizQuestions = templateData.questions || [];
      
      // Allow question modifications if permitted
      if (customizations.questions && template.cachedData?.metadata?.shareOptions?.allowModification !== false) {
        quizQuestions = customizations.questions;
      }

      // Prepare quiz data for creation
      const newQuizData = {
        title: quizTitle,
        description: quizDescription,
        category: customizations.category || template.category,
        difficulty: customizations.difficulty || template.difficulty,
        questions: quizQuestions,
        timeLimit: customizations.timeLimit || templateData.settings?.timeLimit || 30,
        tags: [...(template.tags || []).filter(tag => !['template', 'shared'].includes(tag)), ...(customizations.tags || [])]
      };

      try {
        // Try to create in external API
        const externalResult = await this.apiClient.createQuiz(newQuizData, targetCourseId, instructorId);
        
        // Create local record
        const newQuiz = await prisma.courseQuiz.create({
          data: {
            courseId: targetCourseId,
            externalQuizId: externalResult.data.quiz_id,
            title: quizTitle,
            description: quizDescription,
            category: newQuizData.category,
            difficulty: newQuizData.difficulty,
            tags: newQuizData.tags,
            sharedByUserId: template.sharedByUserId !== instructorId ? template.sharedByUserId : null,
            isActive: true
          }
        });

        // Cache the quiz data
        await this.cacheService.cacheQuizData(newQuiz.id, externalResult.data);

        // Log usage for attribution
        if (template.cachedData?.metadata?.shareOptions?.attribution !== false) {
          console.log(`Template ${templateId} used by instructor ${instructorId} in course ${targetCourseId}`);
        }

        return {
          success: true,
          quiz: {
            id: newQuiz.id,
            title: newQuiz.title,
            description: newQuiz.description,
            category: newQuiz.category,
            difficulty: newQuiz.difficulty,
            createdAt: newQuiz.createdAt,
            questionCount: quizQuestions.length
          },
          mode: 'online'
        };

      } catch (apiError) {
        console.warn('External API failed, creating offline copy:', apiError.message);
        
        // Create offline copy
        const offlineQuiz = await prisma.courseQuiz.create({
          data: {
            courseId: targetCourseId,
            externalQuizId: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: quizTitle,
            description: quizDescription,
            category: newQuizData.category,
            difficulty: newQuizData.difficulty,
            tags: newQuizData.tags,
            sharedByUserId: template.sharedByUserId !== instructorId ? template.sharedByUserId : null,
            isActive: true,
            isCached: true,
            cachedData: {
              questions: quizQuestions,
              settings: {
                timeLimit: newQuizData.timeLimit,
                allowReview: true
              },
              metadata: {
                totalQuestions: quizQuestions.length,
                copiedFromTemplate: templateId,
                needsSync: true,
                createdOffline: true
              },
              cachedAt: new Date().toISOString()
            }
          }
        });

        return {
          success: true,
          quiz: {
            id: offlineQuiz.id,
            title: offlineQuiz.title,
            description: offlineQuiz.description,
            category: offlineQuiz.category,
            difficulty: offlineQuiz.difficulty,
            createdAt: offlineQuiz.createdAt,
            questionCount: quizQuestions.length
          },
          mode: 'offline',
          message: 'Quiz copied locally - will sync when service is available'
        };
      }

    } catch (error) {
      console.error('Copy template error:', error);
      throw error;
    }
  }

  // Get template details for preview
  async getTemplateDetails(templateId, instructorId) {
    try {
      const template = await prisma.courseQuiz.findFirst({
        where: {
          id: templateId,
          isTemplate: true,
          isActive: true
        }
      });

      if (!template) {
        throw new Error('Template not found');
      }

      // Check access permissions
      const canAccess = template.sharedByUserId === instructorId ||
                       template.cachedData?.metadata?.shareOptions?.visibility === 'public' ||
                       template.cachedData?.metadata?.shareOptions?.visibility === 'instructors';

      if (!canAccess) {
        throw new Error('Permission denied to view this template');
      }

      const templateData = template.cachedData;
      const shareOptions = templateData.metadata?.shareOptions || {};

      return {
        success: true,
        template: {
          id: template.id,
          title: template.title,
          description: template.description,
          category: template.category,
          difficulty: template.difficulty,
          tags: template.tags,
          questions: templateData.questions || [],
          questionCount: templateData.questions?.length || 0,
          estimatedTime: templateData.metadata?.estimatedTime,
          originalCourse: templateData.metadata?.originalCourse,
          sharedBy: template.sharedByUserId,
          sharedAt: template.createdAt,
          isOwn: template.sharedByUserId === instructorId,
          permissions: {
            allowModification: shareOptions.allowModification !== false,
            attribution: shareOptions.attribution !== false,
            visibility: shareOptions.visibility || 'public'
          }
        }
      };

    } catch (error) {
      console.error('Get template details error:', error);
      throw error;
    }
  }

  // Delete/unshare a template
  async unshareTemplate(templateId, instructorId) {
    try {
      const template = await prisma.courseQuiz.findFirst({
        where: {
          id: templateId,
          sharedByUserId: instructorId,
          isTemplate: true
        }
      });

      if (!template) {
        throw new Error('Template not found or unauthorized');
      }

      // Soft delete by marking inactive
      await prisma.courseQuiz.update({
        where: { id: templateId },
        data: { isActive: false }
      });

      console.log(`Template ${templateId} unshared by instructor ${instructorId}`);

      return {
        success: true,
        message: 'Template unshared successfully'
      };

    } catch (error) {
      console.error('Unshare template error:', error);
      throw error;
    }
  }

  // Get sharing statistics for an instructor
  async getSharingStats(instructorId) {
    try {
      const stats = await prisma.courseQuiz.groupBy({
        by: ['sharedByUserId'],
        where: {
          sharedByUserId: instructorId,
          isTemplate: true,
          isActive: true
        },
        _count: true
      });

      // Get usage count (how many times their templates have been copied)
      const templateIds = await prisma.courseQuiz.findMany({
        where: {
          sharedByUserId: instructorId,
          isTemplate: true,
          isActive: true
        },
        select: { id: true }
      });

      let usageCount = 0;
      for (const template of templateIds) {
        const copies = await prisma.courseQuiz.count({
          where: {
            sharedByUserId: instructorId,
            isTemplate: false,
            cachedData: {
              path: ['metadata', 'copiedFromTemplate'],
              equals: template.id
            }
          }
        });
        usageCount += copies;
      }

      return {
        success: true,
        stats: {
          templatesShared: stats.length > 0 ? stats[0]._count : 0,
          timesUsed: usageCount,
          templatesUsed: await prisma.courseQuiz.count({
            where: {
              course: { instructorId: instructorId },
              sharedByUserId: { not: instructorId },
              isTemplate: false
            }
          })
        }
      };

    } catch (error) {
      console.error('Get sharing stats error:', error);
      throw error;
    }
  }
}

module.exports = { QuizSharingService };