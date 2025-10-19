# Quiz Builder UI Updates

## Changes Made

### Removed:
1. **Passing Score Section** - Removed the quiz settings panel that included:
   - Passing Score (%) input
   - Time Limit input
   - The entire settings header and container

### Enhanced:
1. **Button Event Handlers** - Updated all three question type buttons to:
   - Prevent default form submission with `e.preventDefault()`
   - Stop event propagation with `e.stopPropagation()`
   - Explicitly call the `addQuestion()` function
   - Added `font-medium` class for better text weight

## Current UI Structure

When a user selects "Quiz" as the lesson type, they now see:

```
┌─────────────────────────────────────────────────┐
│  Questions (0)                                   │
│  [+ Multiple Choice] [+ True/False] [+ Fill in Blank]  │
├─────────────────────────────────────────────────┤
│                                                  │
│  No questions yet. Click a button above to      │
│  add your first question.                       │
│                                                  │
└─────────────────────────────────────────────────┘
```

### After Adding Questions:

```
┌─────────────────────────────────────────────────┐
│  Questions (2)                                   │
│  [+ Multiple Choice] [+ True/False] [+ Fill in Blank]  │
├─────────────────────────────────────────────────┤
│  Q1. [Multiple Choice]                    [🗑️]  │
│  Question: _______________________________       │
│  Options:                                        │
│  ○ Option 1 text                          [🗑️]  │
│  ○ Option 2 text                          [🗑️]  │
│  [+ Add Option]                                  │
│  Explanation: _____________________________      │
├─────────────────────────────────────────────────┤
│  Q2. [True/False]                         [🗑️]  │
│  Question: _______________________________       │
│  Options:                                        │
│  ○ True                                          │
│  ○ False                                         │
│  Explanation: _____________________________      │
└─────────────────────────────────────────────────┘
```

## Question Types

### 1. Multiple Choice
- User can add/remove options
- Select one correct answer via radio button
- Minimum 2 options (can add more)

### 2. True/False
- Fixed two options (True/False)
- Select which one is correct
- Cannot add/remove options

### 3. Fill in the Blank
- Text input for correct answer
- No options to manage
- Case-insensitive matching when students answer

## Data Storage

Quiz data is still stored as JSON in the lesson's `content` field:

```json
{
  "questions": [
    {
      "id": "q-1234567890",
      "type": "multiple-choice",
      "question": "What is 2 + 2?",
      "options": [
        { "id": "opt-1", "text": "3", "isCorrect": false },
        { "id": "opt-2", "text": "4", "isCorrect": true },
        { "id": "opt-3", "text": "5", "isCorrect": false }
      ],
      "explanation": "2 plus 2 equals 4"
    }
  ],
  "passingScore": 70
}
```

Note: `passingScore` is still stored in the data structure (default 70%) but the UI to edit it has been removed. This can be used later for grading logic or removed from the data structure entirely if not needed.

## Testing Checklist

- [ ] Click "Multiple Choice" button - should add a multiple choice question
- [ ] Click "True/False" button - should add a true/false question
- [ ] Click "Fill in Blank" button - should add a fill-in-blank question
- [ ] Add multiple questions of different types
- [ ] Edit question text
- [ ] Add/remove options for multiple choice
- [ ] Mark correct answers
- [ ] Delete questions
- [ ] Save the lesson and verify quiz data is preserved
- [ ] Take the quiz as a student and verify it works

## Notes

- The passing score is still stored in the data (default: 70%) for potential future use
- If you want to completely remove passing score from the data, we can update the initialization to remove it
- Buttons now have explicit event prevention to ensure they work properly within forms
