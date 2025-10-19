# Quiz Builder Bug Fix

## Issue Found ✅

The quiz builder buttons weren't working because of a bug in the `updateSelectedLesson` function.

### Root Cause

In the `updateSelectedLesson` function (line 428-433), there was code that **blocked content updates for quiz lessons**:

```typescript
} else if (field === "content") {
  if (updatedLesson.type === "quiz") {
    return;  // ❌ Early return prevented quiz data from being saved!
  }
  updatedLesson = {
    ...updatedLesson,
    content: typeof value === "string" ? value : updatedLesson.content,
  };
}
```

This meant:
1. User clicks "Add Multiple Choice" button
2. `addQuestion()` function runs and creates new question
3. `updateSelectedLesson('content', JSON.stringify(quizData))` is called
4. Function checks: "Is this a quiz lesson?"
5. ❌ **Returns early without saving!**
6. UI doesn't update, question not added

## Solution Applied ✅

### Change 1: Remove Quiz Content Blocking
```typescript
} else if (field === "content") {
  // Allow content updates for all lesson types, including quiz
  updatedLesson = {
    ...updatedLesson,
    content: typeof value === "string" ? value : updatedLesson.content,
  };
}
```

### Change 2: Initialize Quiz Data on Type Change
When switching to quiz type, now initializes with empty quiz structure:
```typescript
if (field === "type" && typeof value === "string") {
  updatedLesson = {
    ...updatedLesson,
    type: value,
    file: null,
    content: value === "quiz" 
      ? JSON.stringify({ questions: [], passingScore: 70 }) 
      : updatedLesson.content ?? "",
  };
}
```

## What This Fixes

✅ **Add Question Buttons** - Now work correctly when clicked
✅ **Edit Questions** - Changes to question text are saved
✅ **Add/Remove Options** - Multiple choice options can be managed
✅ **Mark Correct Answers** - Radio button selections persist
✅ **Delete Questions** - Questions can be removed
✅ **Add Explanations** - Explanation text is saved

## How It Works Now

1. User selects "Quiz" lesson type
2. Content initializes as `{"questions":[],"passingScore":70}`
3. User clicks "+ Multiple Choice"
4. `addQuestion()` creates new question object
5. `updateSelectedLesson('content', JSON.stringify(quizData))` updates the content
6. ✅ **Content update succeeds** - no early return!
7. `replaceLesson()` updates the lesson in units array
8. React re-renders with new question visible

## Testing Steps

1. **Create a course** and add a unit
2. **Add a lesson** and select "Quiz" type
3. **Click "+ Multiple Choice"** → Should see question form appear
4. **Fill in question text** → Should persist
5. **Add options** → Should appear in list
6. **Mark correct answer** → Radio button should stay selected
7. **Add another question** → Should appear below first one
8. **Delete a question** → Should be removed
9. **Save the course** → Quiz data should be preserved
10. **Edit the course again** → Questions should load correctly

## Data Flow

```
User Action: Click "+ Multiple Choice"
    ↓
addQuestion('multiple-choice')
    ↓
Creates new QuizQuestion object
    ↓
Pushes to quizData.questions array
    ↓
updateSelectedLesson('content', JSON.stringify(quizData))
    ↓
✅ Content field updated (no longer blocked!)
    ↓
replaceLesson(updatedLesson)
    ↓
Updates units state
    ↓
React re-renders
    ↓
New question appears in UI
```

## Before vs After

### Before (Broken):
```
Click button → Function runs → Early return → ❌ Nothing happens
```

### After (Fixed):
```
Click button → Function runs → State updates → ✅ Question appears
```

## Additional Changes Made

1. **Removed Passing Score UI** - Settings section no longer displayed
2. **Enhanced Button Handlers** - Added preventDefault and stopPropagation
3. **Better Initialization** - Quiz type now starts with proper empty structure

## Technical Notes

- Quiz data stored as JSON string in `lesson.content`
- `passingScore` still in data (default: 70) but no UI to edit
- All question operations (add/edit/delete) now work correctly
- State updates properly trigger React re-renders
