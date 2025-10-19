// Dashboard related type definitions

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Course {
  id: string;
  title: string;
  createdAt: string;
  description: string;
  level: string;
  instructorId?: string;
}

export interface EnrolledCourse extends Course {
  progress: string;
  enrollmentId?: string;
  enrolledAt?: string;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

export interface UserStats {
  coursesEnrolled: number;
  coursesCreated: number;
  avgProgress: string;
}
