# Quick Start Guide: Creating and Taking Quiz Lessons

## For Course Creators

### Step 1: Create a Course
1. Navigate to Course Creation
2. Fill in course information (Step 1)

### Step 2: Add Structure
1. Go to Structure tab (Step 2)
2. Create units for your course
3. Add lessons to each unit

### Step 3: Create a Quiz Lesson
1. Go to Content tab (Step 3)
2. Click on a lesson in your structure
3. Select "✏️ Quiz" from the Lesson Type dropdown

### Step 4: Build Your Quiz
You'll see the Quiz Builder with:

#### Quiz Settings:
- **Passing Score**: Set the minimum percentage required to pass (default: 70%)
- **Time Limit**: Optional time limit in minutes

#### Add Questions:
Click one of these buttons to add a question:
- **+ Multiple Choice**: Create a question with multiple options (only one correct)
- **+ True/False**: Create a True or False question
- **+ Fill in Blank**: Create a question where students type the answer

#### For Each Question:
1. **Question Text**: Enter your question
2. **Add Answer Options**:
   - **Multiple Choice**: Add options, click radio button to mark correct one
   - **True/False**: Select which option is correct (True or False)
   - **Fill in Blank**: Enter the correct answer text
3. **Explanation** (Optional): Add an explanation that shows after answering
4. **Delete**: Click trash icon to remove a question

### Step 5: Configure Settings and Publish
1. Go to Settings tab (Step 4)
2. Configure course settings (public, community, discussions)
3. Click **"Publish Course"** button

## For Students

### Taking a Quiz Lesson:

1. **Enroll** in the course
2. **Navigate** to the quiz lesson
3. **Answer Questions**:

   - **Multiple Choice/True-False**:
     - Click on an option to select your answer
     - Immediate feedback shows if you're correct (green) or incorrect (red)
     - The correct answer is highlighted in green
     - You can try other options if you're wrong
   
   - **Fill in the Blank**:
     - Type your answer in the text field
     - Click **Submit** or press **Enter**
     - See if your answer matches the correct one
     - Case doesn't matter (e.g., "Paris" = "paris")

4. **View Feedback**:
   - ✅ **Correct**: Green success message
   - ❌ **Incorrect**: Red message with correct answer shown
   - 💡 **Explanation**: Additional info about the answer (if provided by instructor)

5. **Complete Quiz**:
   - Once all questions answered, see your **Quiz Summary**:
     - Your score (e.g., "3 out of 5")
     - Percentage (e.g., "60%")
     - Pass/Fail indicator based on passing score

## Example Quiz Flow

### Creating:
```
1. Add Lesson → Select "Quiz"
2. Click "+ Multiple Choice"
3. Enter: "What is 2 + 2?"
4. Add options: "3", "4", "5", "6"
5. Mark "4" as correct
6. Add explanation: "2 + 2 equals 4"
7. Click "+ True/False"
8. Enter: "The sky is blue"
9. Mark "True" as correct
10. Set Passing Score: 70%
11. Publish Course
```

### Taking:
```
Student opens quiz lesson:
→ Sees Question 1: "What is 2 + 2?"
→ Clicks option "4"
→ ✅ Green feedback: "Great job! That's the correct answer."
→ Sees explanation: "2 + 2 equals 4"

→ Sees Question 2: "The sky is blue"
→ Clicks "True"
→ ✅ Green feedback: "Great job! That's the correct answer."

→ Quiz Complete!
→ Score: 2 out of 2 (100%)
→ ✅ Passed (Passing score: 70%)
```

## Tips

### For Instructors:
- ✅ Mix quiz lessons with text, audio, and video lessons
- ✅ Add multiple quiz lessons per unit
- ✅ Use explanations to provide learning context
- ✅ Set appropriate passing scores based on difficulty
- ✅ Use fill-in-blank for recall questions
- ✅ Use multiple choice for concept understanding
- ✅ Use true/false for quick checks

### For Students:
- 📝 Read questions carefully
- 🔄 Try other options if you get it wrong (for multiple choice/true-false)
- 💡 Read explanations to learn from mistakes
- ⏱️ Check if there's a time limit before starting
- 🎯 Aim for the passing score to successfully complete the lesson

## Question Types Explained

### 1. Multiple Choice
- **Best for**: Testing understanding, comparing concepts
- **Example**: "Which of these is a programming language?"
  - Python ✓
  - Microsoft Word
  - Google Chrome
  - Adobe Photoshop

### 2. True/False
- **Best for**: Quick fact checking, verifying understanding
- **Example**: "JavaScript was created in 1995"
  - True ✓
  - False

### 3. Fill in the Blank
- **Best for**: Testing recall, vocabulary, specific facts
- **Example**: "The capital of France is ____"
  - Answer: Paris

## Troubleshooting

### Quiz not saving?
- Ensure all questions have text
- Ensure multiple choice questions have at least 2 options
- Ensure correct answers are marked
- Check that course title is unique

### Can't see quiz when taking course?
- Ensure course is published
- Ensure you're enrolled in the course
- Refresh the page
- Check if lesson type is set to "Quiz"

### Answers not being accepted?
- For fill-in-blank: spelling must be exact (case doesn't matter)
- Try refreshing the page
- Ensure JavaScript is enabled in browser

## Need Help?

Check the detailed implementation documentation in `QUIZ_LESSON_IMPLEMENTATION.md` for technical details.
