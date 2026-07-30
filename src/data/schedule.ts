export interface ScheduleBlock {
  id: string
  name: string
  type: 'study' | 'break' | 'meal' | 'sleep'
  startHour: number
  startMinute: number
  durationMinutes: number
  topic?: string
  description?: string
  blockType?: 'dsa' | 'fundamentals' | 'revision' | 'lld-hld' | 'mock' | 'flashcard'
}

export interface DSAQuestion {
  id: string
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  topic: string
  topicType: 'DSA' | 'LLD' | 'HLD' | 'Aptitude' | 'System Design' | 'OOP' | 'OS' | 'DBMS' | 'CN' | 'SQL' | 'Mock'
  starterCode?: string
  testCases?: { input: string; expected: string }[]
  description?: string
}

export interface DaySchedule {
  dayNumber: number
  date: string
  phase: number
  phaseName: string
  dsaTopic: string
  fundamentalsTopic: string
  revisionDays: number[]
  blocks: ScheduleBlock[]
  questions: DSAQuestion[]
  isWeeklyPractice: boolean
  notes?: string
}

export const PLAN_START_DATE = new Date(2025, 6, 30)

export const PHASES = [
  { number: 1, name: 'Foundation Rebuild', days: '1-12', color: '#3b82f6', gradient: 'rgba(37,99,235,0.85)' },
  { number: 2, name: 'Core DSA Depth', days: '13-37', color: '#10b981', gradient: 'rgba(21,128,61,0.85)' },
  { number: 3, name: 'Graphs + DP', days: '38-46', color: '#f59e0b', gradient: 'rgba(146,64,14,0.85)' },
  { number: 4, name: 'Advanced Wrap + LLD/HLD', days: '47-53', color: '#ef4444', gradient: 'rgba(153,27,27,0.85)' },
  { number: 5, name: 'Interview Ready', days: '54-55', color: '#ec4899', gradient: 'rgba(55,48,163,0.85)' },
]

const FUNDAMENTALS_ROTATION = [
  'System Design Basics + Computer Fundamentals',
  'OOP',
  'OS',
  'DBMS',
  'Computer Networks',
  'SQL (queries, joins, window functions)',
]

function getFundamentals(day: number): string {
  return FUNDAMENTALS_ROTATION[day % 6]
}

function getRevisionDays(day: number): number[] {
  const days: number[] = []
  if (day > 3) days.push(day - 3)
  if (day > 7) days.push(day - 7)
  if (day > 15) days.push(day - 15)
  if (day > 30) days.push(day - 30)
  if (day > 45) days.push(day - 45)
  return days
}

function getDateForDay(day: number): string {
  const date = new Date(PLAN_START_DATE)
  date.setDate(date.getDate() + day - 1)
  return date.toISOString().split('T')[0]
}

function getPhase(day: number): { number: number; name: string } {
  if (day <= 12) return { number: 1, name: 'Foundation Rebuild' }
  if (day <= 37) return { number: 2, name: 'Core DSA Depth' }
  if (day <= 46) return { number: 3, name: 'Graphs + DP' }
  if (day <= 53) return { number: 4, name: 'Advanced Wrap + LLD/HLD' }
  return { number: 5, name: 'Interview Ready' }
}

function createBlocks(day: number, dsaTopic: string, fundamentalsTopic: string, revisionTopics: string): ScheduleBlock[] {
  const isDay50Plus = day >= 50
  const isDay54Plus = day >= 54
  const isWeeklyPractice = day % 7 === 0

  let block5Desc = 'DSA practice continued'
  let block5Type: 'dsa' | 'lld-hld' | 'mock' = 'dsa'
  if (isDay54Plus) { block5Desc = 'Mixed mock practice'; block5Type = 'mock' }
  else if (isDay50Plus) { block5Desc = 'LLD/HLD dedicated practice'; block5Type = 'lld-hld' }

  let block6Desc = 'Flashcard rotation + recall'
  let block6Type: 'flashcard' | 'mock' = 'flashcard'
  if (isWeeklyPractice) { block6Desc = '2h timed mixed practice set (4-5 random problems)'; block6Type = 'mock' }

  return [
    { id: 'wake', name: 'Wake + Freshen Up', type: 'break', startHour: 5, startMinute: 30, durationMinutes: 30 },
    { id: 'block1', name: 'Block 1 — New Topic', type: 'study', startHour: 6, startMinute: 0, durationMinutes: 180, topic: dsaTopic, description: 'Learn + solve today\'s DSA topic', blockType: 'dsa' },
    { id: 'breakfast', name: 'Breakfast', type: 'meal', startHour: 9, startMinute: 0, durationMinutes: 30 },
    { id: 'block2', name: 'Block 2 — DSA Practice', type: 'study', startHour: 9, startMinute: 30, durationMinutes: 180, topic: dsaTopic, description: 'Active practice: today + yesterday topic problems', blockType: 'dsa' },
    { id: 'lunch', name: 'Lunch', type: 'meal', startHour: 12, startMinute: 30, durationMinutes: 30 },
    { id: 'block3', name: 'Block 3 — Fundamentals', type: 'study', startHour: 13, startMinute: 0, durationMinutes: 90, topic: fundamentalsTopic, description: 'Fundamentals rotation', blockType: 'fundamentals' },
    { id: 'block4', name: 'Block 4 — Spaced Revision', type: 'study', startHour: 14, startMinute: 30, durationMinutes: 120, topic: revisionTopics, description: 'Revise 3/7/15/30/45 days back — solve 1 fresh problem cold', blockType: 'revision' },
    { id: 'break2', name: 'Break', type: 'break', startHour: 16, startMinute: 30, durationMinutes: 20 },
    { id: 'block5', name: isDay54Plus ? 'Block 5 — Mock Practice' : isDay50Plus ? 'Block 5 — LLD/HLD' : 'Block 5 — DSA Continued', type: 'study', startHour: 16, startMinute: 50, durationMinutes: 180, topic: isDay54Plus ? 'Mixed Mocks' : isDay50Plus ? 'LLD/HLD' : dsaTopic, description: block5Desc, blockType: block5Type },
    { id: 'dinner', name: 'Dinner', type: 'meal', startHour: 19, startMinute: 50, durationMinutes: 30 },
    { id: 'block6', name: isWeeklyPractice ? 'Block 6 — Weekly Mixed Practice' : 'Block 6 — Flashcards', type: 'study', startHour: 20, startMinute: 20, durationMinutes: 120, topic: isWeeklyPractice ? 'Timed Mixed Set' : 'Flashcard Recall', description: block6Desc, blockType: block6Type },
    { id: 'sleep', name: 'Sleep', type: 'sleep', startHour: 22, startMinute: 20, durationMinutes: 420 },
  ]
}

// ===== ALL QUESTIONS FOR 55 DAYS =====
const cppStarter = (code: string) => code

const QUESTIONS: Record<number, DSAQuestion[]> = {
  1: [
    { id: 'd1q1', title: 'Count Digits', difficulty: 'Easy', topic: 'Maths', topicType: 'DSA', starterCode: cppStarter('int countDigits(int n) {\n    // Write your code here\n}'), testCases: [{ input: 'n=329283', expected: '6' }] },
    { id: 'd1q2', title: 'Reverse a Number', difficulty: 'Easy', topic: 'Maths', topicType: 'DSA', starterCode: cppStarter('int reverseNumber(int n) {\n    // Write your code here\n}'), testCases: [{ input: 'n=12345', expected: '54321' }] },
    { id: 'd1q3', title: 'GCD of Two Numbers', difficulty: 'Easy', topic: 'Maths', topicType: 'DSA', starterCode: cppStarter('int gcd(int a, int b) {\n    // Write your code here\n}'), testCases: [{ input: 'a=12, b=18', expected: '6' }] },
    { id: 'd1q4', title: 'Check Prime', difficulty: 'Easy', topic: 'Maths', topicType: 'DSA', starterCode: cppStarter('bool isPrime(int n) {\n    // Write your code here\n}'), testCases: [{ input: 'n=17', expected: 'true' }] },
    { id: 'd1q5', title: 'Sieve of Eratosthenes', difficulty: 'Medium', topic: 'Maths', topicType: 'DSA', starterCode: cppStarter('vector<int> sieve(int n) {\n    // Write your code here\n}'), testCases: [{ input: 'n=30', expected: '[2,3,5,7,11,13,17,19,23,29]' }] },
    { id: 'd1q6', title: 'STL/Collections Review', difficulty: 'Easy', topic: 'STL', topicType: 'DSA', description: 'Review vector, map, set, unordered_map, priority_queue, stack, queue, deque for your language. No coding — just review APIs.', starterCode: cppStarter('// Review your language\'s standard containers\n// C++: vector, map, set, unordered_map, priority_queue\n// Java: ArrayList, HashMap, HashSet, PriorityQueue\n// Python: list, dict, set, heapq') },
    { id: 'd1q7', title: 'File Handling Basics', difficulty: 'Easy', topic: 'File Handling', topicType: 'DSA', description: 'Review file I/O for your language. Read input from file, write output to file.', starterCode: cppStarter('// C++: ifstream/ofstream\n// Java: Scanner/FileWriter\n// Python: open/read/write\n// Practice: read integers from file, process, write output') },
  ],
  2: [
    { id: 'd2q1', title: 'Largest Element in Array', difficulty: 'Easy', topic: 'Arrays', topicType: 'DSA', starterCode: cppStarter('int largest(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[3,1,7,2,9]', expected: '9' }] },
    { id: 'd2q2', title: 'Second Largest Element', difficulty: 'Easy', topic: 'Arrays', topicType: 'DSA', starterCode: cppStarter('int secondLargest(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[3,1,7,2,9]', expected: '7' }] },
    { id: 'd2q3', title: 'Check Sorted Array', difficulty: 'Easy', topic: 'Arrays', topicType: 'DSA', starterCode: cppStarter('bool isSorted(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,3,4]', expected: 'true' }] },
    { id: 'd2q4', title: 'Remove Duplicates from Sorted Array', difficulty: 'Easy', topic: 'Arrays', topicType: 'DSA', starterCode: cppStarter('int removeDuplicates(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[1,1,2,2,3,4]', expected: '4' }] },
    { id: 'd2q5', title: 'Left Rotate Array by K', difficulty: 'Easy', topic: 'Arrays', topicType: 'DSA', starterCode: cppStarter('void rotateLeft(vector<int>& arr, int k) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,3,4,5], k=2', expected: '[3,4,5,1,2]' }] },
    { id: 'd2q6', title: 'Palindrome Number', difficulty: 'Easy', topic: 'Maths', topicType: 'DSA', starterCode: cppStarter('bool isPalindrome(int n) {\n    // Write your code here\n}'), testCases: [{ input: 'n=121', expected: 'true' }] },
    { id: 'd2q7', title: 'Armstrong Number', difficulty: 'Easy', topic: 'Maths', topicType: 'DSA', starterCode: cppStarter('bool isArmstrong(int n) {\n    // Write your code here\n}'), testCases: [{ input: 'n=153', expected: 'true' }] },
  ],
  3: [
    { id: 'd3q1', title: 'Factorial (Recursive)', difficulty: 'Easy', topic: 'Recursion', topicType: 'DSA', starterCode: cppStarter('long long factorial(int n) {\n    // Write your code here\n}'), testCases: [{ input: 'n=5', expected: '120' }] },
    { id: 'd3q2', title: 'Sum of N Natural Numbers', difficulty: 'Easy', topic: 'Recursion', topicType: 'DSA', starterCode: cppStarter('int sumN(int n) {\n    // Write your code here\n}'), testCases: [{ input: 'n=10', expected: '55' }] },
    { id: 'd3q3', title: 'Power of 2', difficulty: 'Easy', topic: 'Recursion', topicType: 'DSA', starterCode: cppStarter('long long powerOf2(int n) {\n    // Write your code here\n}'), testCases: [{ input: 'n=10', expected: '1024' }] },
    { id: 'd3q4', title: 'Print 1 to N', difficulty: 'Easy', topic: 'Recursion', topicType: 'DSA', starterCode: cppStarter('void print1toN(int n) {\n    // Write your code here\n}'), testCases: [{ input: 'n=5', expected: '1 2 3 4 5' }] },
    { id: 'd3q5', title: 'Fibonacci Number', difficulty: 'Easy', topic: 'Recursion', topicType: 'DSA', starterCode: cppStarter('int fib(int n) {\n    // Write your code here\n}'), testCases: [{ input: 'n=10', expected: '55' }] },
    { id: 'd3q6', title: 'Sum of Array Elements (Recursive)', difficulty: 'Easy', topic: 'Recursion', topicType: 'DSA', starterCode: cppStarter('int arraySum(vector<int>& arr, int n) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,3,4,5]', expected: '15' }] },
  ],
  4: [
    { id: 'd4q1', title: 'Reverse Stack Using Recursion', difficulty: 'Medium', topic: 'Recursion', topicType: 'DSA', starterCode: cppStarter('void reverseStack(stack<int>& st) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,3,4]', expected: '[4,3,2,1]' }] },
    { id: 'd4q2', title: 'Sort an Array (Recursive)', difficulty: 'Medium', topic: 'Recursion', topicType: 'DSA', starterCode: cppStarter('void sortArray(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[5,2,8,1,9]', expected: '[1,2,5,8,9]' }] },
    { id: 'd4q3', title: 'Power Set / Subsequences', difficulty: 'Medium', topic: 'Recursion', topicType: 'DSA', starterCode: cppStarter('vector<string> subsequences(string s) {\n    // Write your code here\n}'), testCases: [{ input: '"abc"', expected: '8 subsequences' }] },
    { id: 'd4q4', title: 'Count Good Numbers', difficulty: 'Medium', topic: 'Recursion', topicType: 'DSA', starterCode: cppStarter('int countGoodNumbers(long long n) {\n    // Write your code here\n}'), testCases: [{ input: 'n=4', expected: '6' }] },
    { id: 'd4q5', title: 'Tower of Hanoi', difficulty: 'Medium', topic: 'Recursion', topicType: 'DSA', starterCode: cppStarter('void towerOfHanoi(int n, char from, char to, char aux) {\n    // Write your code here\n}'), testCases: [{ input: 'n=3', expected: '7 moves' }] },
    { id: 'd4q6', title: 'Recursive Binary Search', difficulty: 'Medium', topic: 'Recursion', topicType: 'DSA', starterCode: cppStarter('int binarySearch(vector<int>& arr, int l, int r, int x) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,3,4,5], x=3', expected: '2' }] },
  ],
  5: [
    { id: 'd5q1', title: 'Bubble Sort', difficulty: 'Easy', topic: 'Sorting', topicType: 'DSA', starterCode: cppStarter('void bubbleSort(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[5,2,8,1,9]', expected: '[1,2,5,8,9]' }] },
    { id: 'd5q2', title: 'Selection Sort', difficulty: 'Easy', topic: 'Sorting', topicType: 'DSA', starterCode: cppStarter('void selectionSort(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[5,2,8,1,9]', expected: '[1,2,5,8,9]' }] },
    { id: 'd5q3', title: 'Insertion Sort', difficulty: 'Easy', topic: 'Sorting', topicType: 'DSA', starterCode: cppStarter('void insertionSort(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[5,2,8,1,9]', expected: '[1,2,5,8,9]' }] },
    { id: 'd5q4', title: 'Merge Sort', difficulty: 'Medium', topic: 'Sorting', topicType: 'DSA', starterCode: cppStarter('void mergeSort(vector<int>& arr, int l, int r) {\n    // Write your code here\n}'), testCases: [{ input: '[5,2,8,1,9]', expected: '[1,2,5,8,9]' }] },
    { id: 'd5q5', title: 'Quick Sort', difficulty: 'Medium', topic: 'Sorting', topicType: 'DSA', starterCode: cppStarter('void quickSort(vector<int>& arr, int low, int high) {\n    // Write your code here\n}'), testCases: [{ input: '[5,2,8,1,9]', expected: '[1,2,5,8,9]' }] },
  ],
  6: [
    { id: 'd6q1', title: 'Merge Two Sorted Arrays', difficulty: 'Easy', topic: 'Sorting', topicType: 'DSA', starterCode: cppStarter('vector<int> mergeSorted(vector<int>& a, vector<int>& b) {\n    // Write your code here\n}'), testCases: [{ input: '[1,3,5], [2,4,6]', expected: '[1,2,3,4,5,6]' }] },
    { id: 'd6q2', title: 'Sort 0s 1s 2s (Dutch Flag)', difficulty: 'Medium', topic: 'Sorting', topicType: 'DSA', starterCode: cppStarter('void sortColors(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[2,0,1,0,2,1]', expected: '[0,0,1,1,2,2]' }] },
    { id: 'd6q3', title: 'Find Pivot in Sorted Rotated Array', difficulty: 'Medium', topic: 'Sorting', topicType: 'DSA', starterCode: cppStarter('int findPivot(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[4,5,6,7,0,1,2]', expected: '4' }] },
    { id: 'd6q4', title: 'Kth Largest Element', difficulty: 'Medium', topic: 'Sorting', topicType: 'DSA', starterCode: cppStarter('int findKthLargest(vector<int>& arr, int k) {\n    // Write your code here\n}'), testCases: [{ input: '[3,2,1,5,6,4], k=2', expected: '5' }] },
    { id: 'd6q5', title: 'Missing Number', difficulty: 'Easy', topic: 'Sorting', topicType: 'DSA', starterCode: cppStarter('int missingNumber(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[3,0,1]', expected: '2' }] },
  ],
  7: [
    { id: 'd7q1', title: 'Valid Anagram', difficulty: 'Easy', topic: 'Hashing', topicType: 'DSA', starterCode: cppStarter('bool isAnagram(string s, string t) {\n    // Write your code here\n}'), testCases: [{ input: '"listen", "silent"', expected: 'true' }] },
    { id: 'd7q2', title: 'Frequency of Characters', difficulty: 'Easy', topic: 'Hashing', topicType: 'DSA', starterCode: cppStarter('vector<int> freq(string s) {\n    // Write your code here\n}'), testCases: [{ input: '"aabbbcc"', expected: 'a:2, b:3, c:2' }] },
    { id: 'd7q3', title: 'Valid Palindrome', difficulty: 'Easy', topic: 'Strings', topicType: 'DSA', starterCode: cppStarter('bool isPalindrome(string s) {\n    // Write your code here\n}'), testCases: [{ input: '"A man a plan a canal Panama"', expected: 'true' }] },
    { id: 'd7q4', title: 'Longest Common Prefix', difficulty: 'Easy', topic: 'Strings', topicType: 'DSA', starterCode: cppStarter('string longestCommonPrefix(vector<string>& strs) {\n    // Write your code here\n}'), testCases: [{ input: '["flower","flow","flight"]', expected: '"fl"' }] },
    { id: 'd7q5', title: 'Roman to Integer', difficulty: 'Easy', topic: 'Strings', topicType: 'DSA', starterCode: cppStarter('int romanToInt(string s) {\n    // Write your code here\n}'), testCases: [{ input: '"MCMXCIV"', expected: '1994' }] },
    { id: 'd7q6', title: 'Integer to Roman', difficulty: 'Medium', topic: 'Strings', topicType: 'DSA', starterCode: cppStarter('string intToRoman(int num) {\n    // Write your code here\n}'), testCases: [{ input: 'num=1994', expected: '"MCMXCIV"' }] },
    { id: 'd7q7', title: 'Longest Palindromic Substring', difficulty: 'Medium', topic: 'Strings', topicType: 'DSA', starterCode: cppStarter('string longestPalindrome(string s) {\n    // Write your code here\n}'), testCases: [{ input: '"babad"', expected: '"bab"' }] },
  ],
  8: [
    { id: 'd8q1', title: 'Linear Search', difficulty: 'Easy', topic: 'Arrays', topicType: 'DSA', starterCode: cppStarter('int linearSearch(vector<int>& arr, int x) {\n    // Write your code here\n}'), testCases: [{ input: '[1,3,5,7,9], x=5', expected: '2' }] },
    { id: 'd8q2', title: 'Find Missing and Repeating', difficulty: 'Medium', topic: 'Arrays', topicType: 'DSA', starterCode: cppStarter('vector<int> findMissingRepeating(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[1,3,3,4]', expected: '[3,2]' }] },
    { id: 'd8q3', title: 'Rotate Array Right by K', difficulty: 'Easy', topic: 'Arrays', topicType: 'DSA', starterCode: cppStarter('void rotateRight(vector<int>& arr, int k) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,3,4,5], k=2', expected: '[4,5,1,2,3]' }] },
    { id: 'd8q4', title: 'Set Matrix Zeroes', difficulty: 'Medium', topic: 'Matrix', topicType: 'DSA', starterCode: cppStarter('void setZeroes(vector<vector<int>>& matrix) {\n    // Write your code here\n}'), testCases: [{ input: '[[1,0],[2,3]]', expected: '[[0,0],[2,0]]' }] },
    { id: 'd8q5', title: 'Spiral Matrix', difficulty: 'Medium', topic: 'Matrix', topicType: 'DSA', starterCode: cppStarter('vector<int> spiralOrder(vector<vector<int>>& matrix) {\n    // Write your code here\n}'), testCases: [{ input: '[[1,2,3],[4,5,6],[7,8,9]]', expected: '[1,2,3,6,9,8,7,4,5]' }] },
  ],
  9: [
    { id: 'd9q1', title: 'Search in 2D Matrix', difficulty: 'Medium', topic: 'Matrix', topicType: 'DSA', starterCode: cppStarter('bool searchMatrix(vector<vector<int>>& matrix, int target) {\n    // Write your code here\n}'), testCases: [{ input: '[[1,3,5],[7,9,11]], target=9', expected: 'true' }] },
    { id: 'd9q2', title: 'Transpose Matrix', difficulty: 'Easy', topic: 'Matrix', topicType: 'DSA', starterCode: cppStarter('vector<vector<int>> transpose(vector<vector<int>>& matrix) {\n    // Write your code here\n}'), testCases: [{ input: '[[1,2],[3,4]]', expected: '[[1,3],[2,4]]' }] },
    { id: 'd9q3', title: 'Rotate Image 90 degrees', difficulty: 'Medium', topic: 'Matrix', topicType: 'DSA', starterCode: cppStarter('void rotate(vector<vector<int>>& matrix) {\n    // Write your code here\n}'), testCases: [{ input: '[[1,2],[3,4]]', expected: '[[3,1],[4,2]]' }] },
    { id: 'd9q4', title: 'Pascal Triangle', difficulty: 'Easy', topic: 'Arrays', topicType: 'DSA', starterCode: cppStarter('vector<vector<int>> generate(int numRows) {\n    // Write your code here\n}'), testCases: [{ input: 'numRows=5', expected: '[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]' }] },
    { id: 'd9q5', title: 'Majority Element', difficulty: 'Easy', topic: 'Arrays', topicType: 'DSA', starterCode: cppStarter('int majorityElement(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[3,3,3,1,2]', expected: '3' }] },
  ],
  10: [
    { id: 'd10q1', title: 'Two Sum', difficulty: 'Easy', topic: 'Two Pointers', topicType: 'DSA', starterCode: cppStarter('vector<int> twoSum(vector<int>& arr, int target) {\n    // Write your code here\n}'), testCases: [{ input: '[2,7,11,15], target=9', expected: '[0,1]' }] },
    { id: 'd10q2', title: 'Three Sum', difficulty: 'Medium', topic: 'Two Pointers', topicType: 'DSA', starterCode: cppStarter('vector<vector<int>> threeSum(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[-1,0,1,2,-1,-4]', expected: '[[-1,-1,2],[-1,0,1]]' }] },
    { id: 'd10q3', title: 'Four Sum', difficulty: 'Medium', topic: 'Two Pointers', topicType: 'DSA', starterCode: cppStarter('vector<vector<int>> fourSum(vector<int>& arr, int target) {\n    // Write your code here\n}'), testCases: [{ input: '[1,0,-1,0,-2,2], target=0', expected: '[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]' }] },
    { id: 'd10q4', title: 'Container With Most Water', difficulty: 'Medium', topic: 'Two Pointers', topicType: 'DSA', starterCode: cppStarter('int maxArea(vector<int>& height) {\n    // Write your code here\n}'), testCases: [{ input: '[1,8,6,2,5,4,8,3,7]', expected: '49' }] },
    { id: 'd10q5', title: 'Remove Duplicates (in-place)', difficulty: 'Easy', topic: 'Two Pointers', topicType: 'DSA', starterCode: cppStarter('int removeDuplicates(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[0,0,1,1,1,2,2]', expected: '3' }] },
  ],
  11: [
    { id: 'd11q1', title: '3Sum Closest', difficulty: 'Medium', topic: 'Two Pointers', topicType: 'DSA', starterCode: cppStarter('int threeSumClosest(vector<int>& arr, int target) {\n    // Write your code here\n}'), testCases: [{ input: '[-1,2,1,-4], target=1', expected: '2' }] },
    { id: 'd11q2', title: 'Sort Colors (Dutch Flag)', difficulty: 'Medium', topic: 'Two Pointers', topicType: 'DSA', starterCode: cppStarter('void sortColors(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[2,0,1]', expected: '[0,1,2]' }] },
    { id: 'd11q3', title: 'Longest Consecutive Sequence', difficulty: 'Medium', topic: 'Arrays', topicType: 'DSA', starterCode: cppStarter('int longestConsecutive(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[100,4,200,1,3,2]', expected: '4' }] },
    { id: 'd11q4', title: 'Trapping Rain Water', difficulty: 'Hard', topic: 'Two Pointers', topicType: 'DSA', starterCode: cppStarter('int trap(vector<int>& height) {\n    // Write your code here\n}'), testCases: [{ input: '[0,1,0,2,1,0,1,3,2,1,2,1]', expected: '6' }] },
    { id: 'd11q5', title: 'Next Permutation', difficulty: 'Medium', topic: 'Arrays', topicType: 'DSA', starterCode: cppStarter('void nextPermutation(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,3]', expected: '[1,3,2]' }] },
  ],
  12: [
    { id: 'd12q1', title: 'Subarray Sum Equals K (Prefix Sum)', difficulty: 'Medium', topic: 'Hashing', topicType: 'DSA', starterCode: cppStarter('int subarraySum(vector<int>& arr, int k) {\n    // Write your code here\n}'), testCases: [{ input: '[1,1,1], k=2', expected: '2' }] },
    { id: 'd12q2', title: 'Longest Subarray with Sum K', difficulty: 'Medium', topic: 'Hashing', topicType: 'DSA', starterCode: cppStarter('int longestSubarraySum(vector<int>& arr, int k) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,3,1,1,1], k=3', expected: '3' }] },
    { id: 'd12q3', title: 'Binary Search — Search X', difficulty: 'Easy', topic: 'Binary Search', topicType: 'DSA', starterCode: cppStarter('int search(vector<int>& arr, int x) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,3,4,5], x=3', expected: '2' }] },
    { id: 'd12q4', title: 'Lower Bound', difficulty: 'Easy', topic: 'Binary Search', topicType: 'DSA', starterCode: cppStarter('int lowerBound(vector<int>& arr, int x) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,3,3,5], x=3', expected: '2' }] },
    { id: 'd12q5', title: 'Upper Bound', difficulty: 'Easy', topic: 'Binary Search', topicType: 'DSA', starterCode: cppStarter('int upperBound(vector<int>& arr, int x) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,3,3,5], x=3', expected: '4' }] },
  ],
  13: [
    { id: 'd13q1', title: 'Search Insert Position', difficulty: 'Easy', topic: 'Binary Search', topicType: 'DSA', starterCode: cppStarter('int searchInsert(vector<int>& arr, int target) {\n    // Write your code here\n}'), testCases: [{ input: '[1,3,5,6], target=5', expected: '2' }] },
    { id: 'd13q2', title: 'Find First and Last Position', difficulty: 'Medium', topic: 'Binary Search', topicType: 'DSA', starterCode: cppStarter('vector<int> searchRange(vector<int>& arr, int target) {\n    // Write your code here\n}'), testCases: [{ input: '[5,7,7,8,8,10], target=8', expected: '[3,4]' }] },
    { id: 'd13q3', title: 'Search in Rotated Sorted Array', difficulty: 'Medium', topic: 'Binary Search', topicType: 'DSA', starterCode: cppStarter('int search(vector<int>& arr, int target) {\n    // Write your code here\n}'), testCases: [{ input: '[4,5,6,7,0,1,2], target=0', expected: '4' }] },
    { id: 'd13q4', title: 'Find Peak Element', difficulty: 'Medium', topic: 'Binary Search', topicType: 'DSA', starterCode: cppStarter('int findPeakElement(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,3,1]', expected: '2' }] },
    { id: 'd13q5', title: 'Sqrt(x)', difficulty: 'Easy', topic: 'Binary Search', topicType: 'DSA', starterCode: cppStarter('int mySqrt(int x) {\n    // Write your code here\n}'), testCases: [{ input: 'x=8', expected: '2' }] },
  ],
  14: [
    { id: 'd14q1', title: 'Koko Eating Bananas', difficulty: 'Medium', topic: 'Binary Search', topicType: 'DSA', starterCode: cppStarter('int minEatingSpeed(vector<int>& piles, int h) {\n    // Write your code here\n}'), testCases: [{ input: '[3,6,7,11], h=8', expected: '4' }] },
    { id: 'd14q2', title: 'Aggressive Cows', difficulty: 'Medium', topic: 'Binary Search', topicType: 'DSA', starterCode: cppStarter('int aggressiveCows(vector<int>& stalls, int k) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,4,8,9], k=3', expected: '3' }] },
    { id: 'd14q3', title: 'Book Allocation', difficulty: 'Medium', topic: 'Binary Search', topicType: 'DSA', starterCode: cppStarter('int bookAllocation(vector<int>& books, int m) {\n    // Write your code here\n}'), testCases: [{ input: '[12,34,67,90], m=2', expected: '113' }] },
    { id: 'd14q4', title: 'Split Array Largest Sum', difficulty: 'Hard', topic: 'Binary Search', topicType: 'DSA', starterCode: cppStarter('int splitArray(vector<int>& arr, int k) {\n    // Write your code here\n}'), testCases: [{ input: '[7,2,5,10,8], k=2', expected: '18' }] },
    { id: 'd14q5', title: 'Nth Root of a Number', difficulty: 'Medium', topic: 'Binary Search', topicType: 'DSA', starterCode: cppStarter('int nthRoot(int n, int m) {\n    // Write your code here\n}'), testCases: [{ input: 'n=3, m=27', expected: '3' }] },
  ],
  15: [
    { id: 'd15q1', title: 'Find Minimum in Rotated Array', difficulty: 'Medium', topic: 'Binary Search', topicType: 'DSA', starterCode: cppStarter('int findMin(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[3,4,5,1,2]', expected: '1' }] },
    { id: 'd15q2', title: 'Single Element in Sorted Array', difficulty: 'Medium', topic: 'Binary Search', topicType: 'DSA', starterCode: cppStarter('int singleNonDuplicate(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[1,1,2,3,3,4,4]', expected: '2' }] },
    { id: 'd15q3', title: 'Capacity To Ship Packages', difficulty: 'Medium', topic: 'Binary Search', topicType: 'DSA', starterCode: cppStarter('int shipWithinDays(vector<int>& weights, int days) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,3,4,5,6,7,8,9,10], days=5', expected: '15' }] },
    { id: 'd15q4', title: 'Kth Missing Positive Number', difficulty: 'Easy', topic: 'Binary Search', topicType: 'DSA', starterCode: cppStarter('int findKthPositive(vector<int>& arr, int k) {\n    // Write your code here\n}'), testCases: [{ input: '[2,3,4,7,11], k=5', expected: '9' }] },
    { id: 'd15q5', title: 'Search in Rotated Array II (duplicates)', difficulty: 'Medium', topic: 'Binary Search', topicType: 'DSA', starterCode: cppStarter('bool search(vector<int>& arr, int target) {\n    // Write your code here\n}'), testCases: [{ input: '[2,5,6,0,0,1,2], target=0', expected: 'true' }] },
    { id: 'd15q6', title: 'Median of Two Sorted Arrays', difficulty: 'Hard', topic: 'Binary Search', topicType: 'DSA', starterCode: cppStarter('double findMedianSortedArrays(vector<int>& a, vector<int>& b) {\n    // Write your code here\n}'), testCases: [{ input: '[1,3], [2]', expected: '2.0' }] },
  ],
  16: [
    { id: 'd16q1', title: 'Subsets I', difficulty: 'Medium', topic: 'Backtracking', topicType: 'DSA', starterCode: cppStarter('vector<vector<int>> subsets(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,3]', expected: '8 subsets' }] },
    { id: 'd16q2', title: 'Subsets II (with duplicates)', difficulty: 'Medium', topic: 'Backtracking', topicType: 'DSA', starterCode: cppStarter('vector<vector<int>> subsetsWithDup(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,2]', expected: '6 subsets' }] },
    { id: 'd16q3', title: 'Combination Sum I', difficulty: 'Medium', topic: 'Backtracking', topicType: 'DSA', starterCode: cppStarter('vector<vector<int>> combinationSum(vector<int>& arr, int target) {\n    // Write your code here\n}'), testCases: [{ input: '[2,3,6,7], target=7', expected: '[[2,2,3],[7]]' }] },
    { id: 'd16q4', title: 'Combination Sum II', difficulty: 'Medium', topic: 'Backtracking', topicType: 'DSA', starterCode: cppStarter('vector<vector<int>> combinationSum2(vector<int>& arr, int target) {\n    // Write your code here\n}'), testCases: [{ input: '[10,1,2,7,6,1,5], target=8', expected: '[[1,1,6],[1,2,5],[1,7],[2,6]]' }] },
    { id: 'd16q5', title: 'Letter Combinations of Phone Number', difficulty: 'Medium', topic: 'Backtracking', topicType: 'DSA', starterCode: cppStarter('vector<string> letterCombinations(string digits) {\n    // Write your code here\n}'), testCases: [{ input: '"23"', expected: '["ad","ae","af","bd","be","bf","cd","ce","cf"]' }] },
  ],
  17: [
    { id: 'd17q1', title: 'Combination Sum III', difficulty: 'Medium', topic: 'Backtracking', topicType: 'DSA', starterCode: cppStarter('vector<vector<int>> combinationSum3(int k, int n) {\n    // Write your code here\n}'), testCases: [{ input: 'k=3, n=7', expected: '[[1,2,4]]' }] },
    { id: 'd17q2', title: 'Palindrome Partitioning', difficulty: 'Medium', topic: 'Backtracking', topicType: 'DSA', starterCode: cppStarter('vector<vector<string>> partition(string s) {\n    // Write your code here\n}'), testCases: [{ input: '"aab"', expected: '[["a","a","b"],["aa","b"]]' }] },
    { id: 'd17q3', title: 'Word Search', difficulty: 'Medium', topic: 'Backtracking', topicType: 'DSA', starterCode: cppStarter('bool exist(vector<vector<char>>& board, string word) {\n    // Write your code here\n}'), testCases: [{ input: 'board=[["ABCE","SFCS","ADEE"]], word="ABCCED"', expected: 'true' }] },
    { id: 'd17q4', title: 'N-Queens', difficulty: 'Hard', topic: 'Backtracking', topicType: 'DSA', starterCode: cppStarter('vector<vector<string>> solveNQueens(int n) {\n    // Write your code here\n}'), testCases: [{ input: 'n=4', expected: '2 solutions' }] },
    { id: 'd17q5', title: 'Sudoku Solver', difficulty: 'Hard', topic: 'Backtracking', topicType: 'DSA', starterCode: cppStarter('void solveSudoku(vector<vector<char>>& board) {\n    // Write your code here\n}'), testCases: [{ input: 'partially filled board', expected: 'solved board' }] },
    { id: 'd17q6', title: 'Rat in a Maze', difficulty: 'Medium', topic: 'Backtracking', topicType: 'DSA', starterCode: cppStarter('vector<string> ratInMaze(vector<vector<int>>& maze) {\n    // Write your code here\n}'), testCases: [{ input: 'maze with path', expected: 'all valid paths' }] },
    { id: 'd17q7', title: 'M-Coloring Problem', difficulty: 'Medium', topic: 'Backtracking', topicType: 'DSA', starterCode: cppStarter('bool graphColoring(vector<int> adj[], int m, int n) {\n    // Write your code here\n}'), testCases: [{ input: 'graph, m=3', expected: 'true/false' }] },
  ],
  18: [
    { id: 'd18q1', title: 'Reverse Linked List', difficulty: 'Easy', topic: 'Linked List', topicType: 'DSA', starterCode: cppStarter('ListNode* reverseList(ListNode* head) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,3,4,5]', expected: '[5,4,3,2,1]' }] },
    { id: 'd18q2', title: 'Middle of Linked List', difficulty: 'Easy', topic: 'Linked List', topicType: 'DSA', starterCode: cppStarter('ListNode* middleNode(ListNode* head) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,3,4,5]', expected: '[3,4,5]' }] },
    { id: 'd18q3', title: 'Merge Two Sorted Lists', difficulty: 'Easy', topic: 'Linked List', topicType: 'DSA', starterCode: cppStarter('ListNode* mergeTwoLists(ListNode* l1, ListNode* l2) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,4], [1,3,4]', expected: '[1,1,2,3,4,4]' }] },
    { id: 'd18q4', title: 'Remove Nth Node From End', difficulty: 'Medium', topic: 'Linked List', topicType: 'DSA', starterCode: cppStarter('ListNode* removeNthFromEnd(ListNode* head, int n) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,3,4,5], n=2', expected: '[1,2,3,5]' }] },
    { id: 'd18q5', title: 'Delete Node in Doubly Linked List', difficulty: 'Easy', topic: 'Linked List', topicType: 'DSA', starterCode: cppStarter('void deleteNode(DLLNode* head, DLLNode* node) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,3,4], node=3', expected: '[1,2,4]' }] },
  ],
  19: [
    { id: 'd19q1', title: 'Add Two Numbers (LL)', difficulty: 'Medium', topic: 'Linked List', topicType: 'DSA', starterCode: cppStarter('ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {\n    // Write your code here\n}'), testCases: [{ input: '[2,4,3], [5,6,4]', expected: '[7,0,8]' }] },
    { id: 'd19q2', title: 'Linked List Cycle', difficulty: 'Easy', topic: 'Linked List', topicType: 'DSA', starterCode: cppStarter('bool hasCycle(ListNode* head) {\n    // Write your code here\n}'), testCases: [{ input: '[3,2,0,-4] with cycle', expected: 'true' }] },
    { id: 'd19q3', title: 'Find Start of Cycle', difficulty: 'Medium', topic: 'Linked List', topicType: 'DSA', starterCode: cppStarter('ListNode* detectCycle(ListNode* head) {\n    // Write your code here\n}'), testCases: [{ input: '[3,2,0,-4] with cycle', expected: 'node at index 1' }] },
    { id: 'd19q4', title: 'Palindrome Linked List', difficulty: 'Medium', topic: 'Linked List', topicType: 'DSA', starterCode: cppStarter('bool isPalindrome(ListNode* head) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,2,1]', expected: 'true' }] },
    { id: 'd19q5', title: 'Intersection of Two Linked Lists', difficulty: 'Medium', topic: 'Linked List', topicType: 'DSA', starterCode: cppStarter('ListNode* getIntersectionNode(ListNode* headA, ListNode* headB) {\n    // Write your code here\n}'), testCases: [{ input: 'intersecting lists', expected: 'intersection node' }] },
  ],
  20: [
    { id: 'd20q1', title: 'Reverse in Groups of K', difficulty: 'Medium', topic: 'Linked List', topicType: 'DSA', starterCode: cppStarter('ListNode* reverseKGroup(ListNode* head, int k) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,3,4,5], k=2', expected: '[2,1,4,3,5]' }] },
    { id: 'd20q2', title: 'Detect Cycle + Remove', difficulty: 'Medium', topic: 'Linked List', topicType: 'DSA', starterCode: cppStarter('void removeCycle(ListNode* head) {\n    // Write your code here\n}'), testCases: [{ input: 'list with cycle', expected: 'list without cycle' }] },
    { id: 'd20q3', title: 'Flatten a Multilevel DLL', difficulty: 'Medium', topic: 'Linked List', topicType: 'DSA', starterCode: cppStarter('Node* flatten(Node* head) {\n    // Write your code here\n}'), testCases: [{ input: 'multilevel list', expected: 'flattened list' }] },
    { id: 'd20q4', title: 'Clone LL with Random Pointer', difficulty: 'Medium', topic: 'Linked List', topicType: 'DSA', starterCode: cppStarter('Node* copyRandomList(Node* head) {\n    // Write your code here\n}'), testCases: [{ input: '[[7,null],[13,0]]', expected: 'deep copy' }] },
    { id: 'd20q5', title: 'Rotate List Right by K', difficulty: 'Medium', topic: 'Linked List', topicType: 'DSA', starterCode: cppStarter('ListNode* rotateRight(ListNode* head, int k) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,3,4,5], k=2', expected: '[4,5,1,2,3]' }] },
  ],
  21: [
    { id: 'd21q1', title: 'Sort Linked List (Merge Sort)', difficulty: 'Medium', topic: 'Linked List', topicType: 'DSA', starterCode: cppStarter('ListNode* sortList(ListNode* head) {\n    // Write your code here\n}'), testCases: [{ input: '[4,2,1,3]', expected: '[1,2,3,4]' }] },
    { id: 'd21q2', title: 'Partition List', difficulty: 'Medium', topic: 'Linked List', topicType: 'DSA', starterCode: cppStarter('ListNode* partition(ListNode* head, int x) {\n    // Write your code here\n}'), testCases: [{ input: '[1,4,3,2,5,2], x=3', expected: '[1,2,2,4,3,5]' }] },
    { id: 'd21q3', title: 'Odd Even Linked List', difficulty: 'Medium', topic: 'Linked List', topicType: 'DSA', starterCode: cppStarter('ListNode* oddEvenList(ListNode* head) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,3,4,5]', expected: '[1,3,5,2,4]' }] },
    { id: 'd21q4', title: 'Remove Duplicates from Sorted List II', difficulty: 'Medium', topic: 'Linked List', topicType: 'DSA', starterCode: cppStarter('ListNode* deleteDuplicates(ListNode* head) {\n    // Write your code here\n}'), testCases: [{ input: '[1,1,2,3,3,4]', expected: '[2,4]' }] },
    { id: 'd21q5', title: 'Swap Nodes in Pairs', difficulty: 'Medium', topic: 'Linked List', topicType: 'DSA', starterCode: cppStarter('ListNode* swapPairs(ListNode* head) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,3,4]', expected: '[2,1,4,3]' }] },
  ],
  22: [
    { id: 'd22q1', title: 'Reverse Nodes in K Group (Hard)', difficulty: 'Hard', topic: 'Linked List', topicType: 'DSA', starterCode: cppStarter('ListNode* reverseKGroupHard(ListNode* head, int k) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,3,4,5], k=3', expected: '[3,2,1,4,5]' }] },
    { id: 'd22q2', title: 'Merge K Sorted Lists', difficulty: 'Hard', topic: 'Linked List', topicType: 'DSA', starterCode: cppStarter('ListNode* mergeKLists(vector<ListNode*>& lists) {\n    // Write your code here\n}'), testCases: [{ input: '[[1,4,5],[1,3,4],[2,6]]', expected: '[1,1,2,3,4,4,5,6]' }] },
    { id: 'd22q3', title: 'LRU Cache (using LL)', difficulty: 'Hard', topic: 'Linked List', topicType: 'DSA', starterCode: cppStarter('class LRUCache {\n    // Write your code here\n}'), testCases: [{ input: 'operations', expected: 'correct values' }] },
    { id: 'd22q4', title: 'Copy List with Random Pointer', difficulty: 'Hard', topic: 'Linked List', topicType: 'DSA', starterCode: cppStarter('Node* copyRandomList(Node* head) {\n    // Write your code here\n}'), testCases: [{ input: '[[7,null],[13,0]]', expected: 'deep copy' }] },
    { id: 'd22q5', title: 'All Nodes Distance K in Binary Tree', difficulty: 'Hard', topic: 'Linked List', topicType: 'DSA', starterCode: cppStarter('vector<int> distanceK(TreeNode* root, TreeNode* target, int k) {\n    // Write your code here\n}'), testCases: [{ input: 'tree, target=5, k=2', expected: '[7,4,1]' }] },
  ],
  23: [
    { id: 'd23q1', title: 'Single Number (XOR)', difficulty: 'Easy', topic: 'Bit Manipulation', topicType: 'DSA', starterCode: cppStarter('int singleNumber(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[2,2,1]', expected: '1' }] },
    { id: 'd23q2', title: 'Number of 1 Bits', difficulty: 'Easy', topic: 'Bit Manipulation', topicType: 'DSA', starterCode: cppStarter('int hammingWeight(uint32_t n) {\n    // Write your code here\n}'), testCases: [{ input: 'n=11', expected: '3' }] },
    { id: 'd23q3', title: 'Counting Bits', difficulty: 'Easy', topic: 'Bit Manipulation', topicType: 'DSA', starterCode: cppStarter('vector<int> countBits(int n) {\n    // Write your code here\n}'), testCases: [{ input: 'n=5', expected: '[0,1,1,2,1,2]' }] },
    { id: 'd23q4', title: 'Missing Number (XOR)', difficulty: 'Easy', topic: 'Bit Manipulation', topicType: 'DSA', starterCode: cppStarter('int missingNumber(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[3,0,1]', expected: '2' }] },
    { id: 'd23q5', title: 'Power of Two', difficulty: 'Easy', topic: 'Bit Manipulation', topicType: 'DSA', starterCode: cppStarter('bool isPowerOfTwo(int n) {\n    // Write your code here\n}'), testCases: [{ input: 'n=16', expected: 'true' }] },
    { id: 'd23q6', title: 'Divide Two Integers', difficulty: 'Medium', topic: 'Bit Manipulation', topicType: 'DSA', starterCode: cppStarter('int divide(int dividend, int divisor) {\n    // Write your code here\n}'), testCases: [{ input: '10, 3', expected: '3' }] },
    { id: 'd23q7', title: 'Subsets (Bitmask)', difficulty: 'Medium', topic: 'Bit Manipulation', topicType: 'DSA', starterCode: cppStarter('vector<vector<int>> subsets(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,3]', expected: '8 subsets' }] },
  ],
  24: [
    { id: 'd24q1', title: 'Activity Selection (Greedy)', difficulty: 'Medium', topic: 'Greedy', topicType: 'DSA', starterCode: cppStarter('int activitySelection(vector<int>& start, vector<int>& end) {\n    // Write your code here\n}'), testCases: [{ input: 'start=[1,3,0,5], end=[2,4,6,7]', expected: '3' }] },
    { id: 'd24q2', title: 'Fractional Knapsack', difficulty: 'Medium', topic: 'Greedy', topicType: 'DSA', starterCode: cppStarter('double fractionalKnapsack(int W, vector<int>& wt, vector<int>& val) {\n    // Write your code here\n}'), testCases: [{ input: 'W=50, wt=[10,20,30], val=[60,100,120]', expected: '240' }] },
    { id: 'd24q3', title: 'Job Sequencing with Deadline', difficulty: 'Medium', topic: 'Greedy', topicType: 'DSA', starterCode: cppStarter('vector<int> jobScheduling(vector<int>& deadline, vector<int>& profit) {\n    // Write your code here\n}'), testCases: [{ input: 'deadline=[2,1,2,1], profit=[100,19,27,25]', expected: '[2,127]' }] },
    { id: 'd24q4', title: 'Minimum Platforms', difficulty: 'Medium', topic: 'Greedy', topicType: 'DSA', starterCode: cppStarter('int minPlatforms(vector<int>& arr, vector<int>& dep) {\n    // Write your code here\n}'), testCases: [{ input: 'arr=[900,940,950,1100], dep=[910,1120,1130,1200]', expected: '3' }] },
    { id: 'd24q5', title: 'Assign Cookies', difficulty: 'Easy', topic: 'Greedy', topicType: 'DSA', starterCode: cppStarter('int findContentChildren(vector<int>& g, vector<int>& s) {\n    // Write your code here\n}'), testCases: [{ input: 'g=[1,2,3], s=[1,1]', expected: '1' }] },
  ],
  25: [
    { id: 'd25q1', title: 'Jump Game', difficulty: 'Medium', topic: 'Greedy', topicType: 'DSA', starterCode: cppStarter('bool canJump(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[2,3,1,1,4]', expected: 'true' }] },
    { id: 'd25q2', title: 'Jump Game II (Min Jumps)', difficulty: 'Medium', topic: 'Greedy', topicType: 'DSA', starterCode: cppStarter('int jump(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[2,3,1,1,4]', expected: '2' }] },
    { id: 'd25q3', title: 'Gas Station', difficulty: 'Medium', topic: 'Greedy', topicType: 'DSA', starterCode: cppStarter('int canCompleteCircuit(vector<int>& gas, vector<int>& cost) {\n    // Write your code here\n}'), testCases: [{ input: 'gas=[1,2,3,4,5], cost=[3,4,5,1,2]', expected: '3' }] },
    { id: 'd25q4', title: 'Candy Distribution', difficulty: 'Hard', topic: 'Greedy', topicType: 'DSA', starterCode: cppStarter('int candy(vector<int>& ratings) {\n    // Write your code here\n}'), testCases: [{ input: '[1,0,2]', expected: '5' }] },
    { id: 'd25q5', title: 'Task Scheduler', difficulty: 'Medium', topic: 'Greedy', topicType: 'DSA', starterCode: cppStarter('int leastInterval(vector<char>& tasks, int n) {\n    // Write your code here\n}'), testCases: [{ input: '["A","A","A","B","B","B"], n=2', expected: '8' }] },
  ],
  26: [
    { id: 'd26q1', title: 'Max Sum Subarray of Size K', difficulty: 'Easy', topic: 'Sliding Window', topicType: 'DSA', starterCode: cppStarter('int maxSumSubarray(vector<int>& arr, int k) {\n    // Write your code here\n}'), testCases: [{ input: '[2,1,5,1,3,2], k=3', expected: '9' }] },
    { id: 'd26q2', title: 'Longest Substring Without Repeating', difficulty: 'Medium', topic: 'Sliding Window', topicType: 'DSA', starterCode: cppStarter('int lengthOfLongestSubstring(string s) {\n    // Write your code here\n}'), testCases: [{ input: '"abcabcbb"', expected: '3' }] },
    { id: 'd26q3', title: 'Longest Repeating Character Replacement', difficulty: 'Medium', topic: 'Sliding Window', topicType: 'DSA', starterCode: cppStarter('int characterReplacement(string s, int k) {\n    // Write your code here\n}'), testCases: [{ input: '"ABAB", k=2', expected: '4' }] },
    { id: 'd26q4', title: 'Minimum Window Substring', difficulty: 'Hard', topic: 'Sliding Window', topicType: 'DSA', starterCode: cppStarter('string minWindow(string s, string t) {\n    // Write your code here\n}'), testCases: [{ input: 's="ADOBECODEBANC", t="ABC"', expected: '"BANC"' }] },
    { id: 'd26q5', title: 'Sliding Window Maximum', difficulty: 'Hard', topic: 'Sliding Window', topicType: 'DSA', starterCode: cppStarter('vector<int> maxSlidingWindow(vector<int>& arr, int k) {\n    // Write your code here\n}'), testCases: [{ input: '[1,3,-1,-3,5,3,6,7], k=3', expected: '[3,3,5,5,6,7]' }] },
  ],
  27: [
    { id: 'd27q1', title: 'Fruit Into Baskets', difficulty: 'Medium', topic: 'Sliding Window', topicType: 'DSA', starterCode: cppStarter('int totalFruit(vector<int>& fruits) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,1]', expected: '3' }] },
    { id: 'd27q2', title: 'Permutation in String', difficulty: 'Medium', topic: 'Sliding Window', topicType: 'DSA', starterCode: cppStarter('bool checkInclusion(string s1, string s2) {\n    // Write your code here\n}'), testCases: [{ input: 's1="ab", s2="eidbaooo"', expected: 'true' }] },
    { id: 'd27q3', title: 'Longest Subarray of 1s After Deleting One', difficulty: 'Medium', topic: 'Sliding Window', topicType: 'DSA', starterCode: cppStarter('int longestSubarray(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[1,1,0,1]', expected: '3' }] },
    { id: 'd27q4', title: 'Max Consecutive Ones III', difficulty: 'Medium', topic: 'Sliding Window', topicType: 'DSA', starterCode: cppStarter('int longestOnes(vector<int>& arr, int k) {\n    // Write your code here\n}'), testCases: [{ input: '[1,1,1,0,0,0,1,1,1,1,0], k=2', expected: '6' }] },
    { id: 'd27q5', title: 'Count Number of Nice Subarrays', difficulty: 'Medium', topic: 'Sliding Window', topicType: 'DSA', starterCode: cppStarter('int numberOfSubarrays(vector<int>& arr, int k) {\n    // Write your code here\n}'), testCases: [{ input: '[1,1,2,1,1], k=3', expected: '2' }] },
  ],
  28: [
    { id: 'd28q1', title: 'Valid Parentheses', difficulty: 'Easy', topic: 'Stack', topicType: 'DSA', starterCode: cppStarter('bool isValid(string s) {\n    // Write your code here\n}'), testCases: [{ input: '"()[]{}"', expected: 'true' }] },
    { id: 'd28q2', title: 'Implement Stack using Array', difficulty: 'Easy', topic: 'Stack', topicType: 'DSA', starterCode: cppStarter('class Stack {\n    // Write your code here\n}'), testCases: [{ input: 'push/pop', expected: 'LIFO' }] },
    { id: 'd28q3', title: 'Implement Queue using Stack', difficulty: 'Easy', topic: 'Queue', topicType: 'DSA', starterCode: cppStarter('class MyQueue {\n    // Write your code here\n}'), testCases: [{ input: 'push/pop', expected: 'FIFO' }] },
    { id: 'd28q4', title: 'Min Stack', difficulty: 'Medium', topic: 'Stack', topicType: 'DSA', starterCode: cppStarter('class MinStack {\n    // Write your code here\n}'), testCases: [{ input: 'push(-2),push(0),push(-3),getMin', expected: '-3' }] },
    { id: 'd28q5', title: 'Next Greater Element', difficulty: 'Medium', topic: 'Stack', topicType: 'DSA', starterCode: cppStarter('vector<int> nextGreaterElement(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[4,5,2,10,8]', expected: '[5,10,10,-1,-1]' }] },
  ],
  29: [
    { id: 'd29q1', title: 'Largest Rectangle in Histogram', difficulty: 'Hard', topic: 'Stack', topicType: 'DSA', starterCode: cppStarter('int largestRectangleArea(vector<int>& heights) {\n    // Write your code here\n}'), testCases: [{ input: '[2,1,5,6,2,3]', expected: '10' }] },
    { id: 'd29q2', title: 'Daily Temperatures', difficulty: 'Medium', topic: 'Stack', topicType: 'DSA', starterCode: cppStarter('vector<int> dailyTemperatures(vector<int>& temps) {\n    // Write your code here\n}'), testCases: [{ input: '[73,74,75,71,69,72,76,73]', expected: '[1,1,4,2,1,1,0,0]' }] },
    { id: 'd29q3', title: 'Evaluate Reverse Polish Notation', difficulty: 'Medium', topic: 'Stack', topicType: 'DSA', starterCode: cppStarter('int evalRPN(vector<string>& tokens) {\n    // Write your code here\n}'), testCases: [{ input: '["2","1","+","3","*"]', expected: '9' }] },
    { id: 'd29q4', title: 'Asteroid Collision', difficulty: 'Medium', topic: 'Stack', topicType: 'DSA', starterCode: cppStarter('vector<int> asteroidCollision(vector<int>& asteroids) {\n    // Write your code here\n}'), testCases: [{ input: '[5,10,-5]', expected: '[5,10]' }] },
    { id: 'd29q5', title: 'Online Stock Span', difficulty: 'Medium', topic: 'Stack', topicType: 'DSA', starterCode: cppStarter('class StockSpanner {\n    // Write your code here\n}'), testCases: [{ input: '[100,80,60,70,60,75,85]', expected: '[1,1,1,2,1,4,6]' }] },
  ],
  30: [
    { id: 'd30q1', title: 'Sliding Window Maximum (Deque)', difficulty: 'Hard', topic: 'Stack/Queue', topicType: 'DSA', starterCode: cppStarter('vector<int> maxSlidingWindow(vector<int>& arr, int k) {\n    // Write your code here\n}'), testCases: [{ input: '[1,3,-1,-3,5,3,6,7], k=3', expected: '[3,3,5,5,6,7]' }] },
    { id: 'd30q2', title: 'LRU Cache (Design)', difficulty: 'Medium', topic: 'Stack/Queue', topicType: 'DSA', starterCode: cppStarter('class LRUCache {\n    // Write your code here\n}'), testCases: [{ input: 'put(1,1),put(2,2),get(1),put(3,3),get(2)', expected: '[1,-1]' }] },
    { id: 'd30q3', title: 'LFU Cache (Design)', difficulty: 'Hard', topic: 'Stack/Queue', topicType: 'DSA', starterCode: cppStarter('class LFUCache {\n    // Write your code here\n}'), testCases: [{ input: 'operations', expected: 'correct values' }] },
    { id: 'd30q4', title: 'First Non-Repeating in Stream', difficulty: 'Medium', topic: 'Queue', topicType: 'DSA', starterCode: cppStarter('string firstNonRepeating(string s) {\n    // Write your code here\n}'), testCases: [{ input: '"aabcb"', expected: 'a#b#b' }] },
    { id: 'd30q5', title: 'Circular Queue Design', difficulty: 'Medium', topic: 'Queue', topicType: 'DSA', starterCode: cppStarter('class MyCircularQueue {\n    // Write your code here\n}'), testCases: [{ input: 'enQueue/deQueue', expected: 'correct values' }] },
  ],
  31: [
    { id: 'd31q1', title: 'Inorder Traversal', difficulty: 'Easy', topic: 'Binary Tree', topicType: 'DSA', starterCode: cppStarter('vector<int> inorderTraversal(TreeNode* root) {\n    // Write your code here\n}'), testCases: [{ input: '[1,null,2,3]', expected: '[1,3,2]' }] },
    { id: 'd31q2', title: 'Preorder Traversal', difficulty: 'Easy', topic: 'Binary Tree', topicType: 'DSA', starterCode: cppStarter('vector<int> preorderTraversal(TreeNode* root) {\n    // Write your code here\n}'), testCases: [{ input: '[1,null,2,3]', expected: '[1,2,3]' }] },
    { id: 'd31q3', title: 'Postorder Traversal', difficulty: 'Easy', topic: 'Binary Tree', topicType: 'DSA', starterCode: cppStarter('vector<int> postorderTraversal(TreeNode* root) {\n    // Write your code here\n}'), testCases: [{ input: '[1,null,2,3]', expected: '[3,2,1]' }] },
    { id: 'd31q4', title: 'Level Order Traversal', difficulty: 'Medium', topic: 'Binary Tree', topicType: 'DSA', starterCode: cppStarter('vector<vector<int>> levelOrder(TreeNode* root) {\n    // Write your code here\n}'), testCases: [{ input: '[3,9,20,null,null,15,7]', expected: '[[3],[9,20],[15,7]]' }] },
    { id: 'd31q5', title: 'Maximum Depth of Binary Tree', difficulty: 'Easy', topic: 'Binary Tree', topicType: 'DSA', starterCode: cppStarter('int maxDepth(TreeNode* root) {\n    // Write your code here\n}'), testCases: [{ input: '[3,9,20,null,null,15,7]', expected: '3' }] },
  ],
  32: [
    { id: 'd32q1', title: 'Diameter of Binary Tree', difficulty: 'Easy', topic: 'Binary Tree', topicType: 'DSA', starterCode: cppStarter('int diameterOfBinaryTree(TreeNode* root) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,3,4,5]', expected: '3' }] },
    { id: 'd32q2', title: 'Balanced Binary Tree', difficulty: 'Easy', topic: 'Binary Tree', topicType: 'DSA', starterCode: cppStarter('bool isBalanced(TreeNode* root) {\n    // Write your code here\n}'), testCases: [{ input: '[3,9,20,null,null,15,7]', expected: 'true' }] },
    { id: 'd32q3', title: 'Same Tree', difficulty: 'Easy', topic: 'Binary Tree', topicType: 'DSA', starterCode: cppStarter('bool isSameTree(TreeNode* p, TreeNode* q) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,3], [1,2,3]', expected: 'true' }] },
    { id: 'd32q4', title: 'Symmetric Tree', difficulty: 'Easy', topic: 'Binary Tree', topicType: 'DSA', starterCode: cppStarter('bool isSymmetric(TreeNode* root) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,2,3,4,4,3]', expected: 'true' }] },
    { id: 'd32q5', title: 'Path Sum', difficulty: 'Easy', topic: 'Binary Tree', topicType: 'DSA', starterCode: cppStarter('bool hasPathSum(TreeNode* root, int targetSum) {\n    // Write your code here\n}'), testCases: [{ input: '[5,4,8,11,null,13,4], targetSum=22', expected: 'true' }] },
  ],
  33: [
    { id: 'd33q1', title: 'Binary Tree Maximum Path Sum', difficulty: 'Hard', topic: 'Binary Tree', topicType: 'DSA', starterCode: cppStarter('int maxPathSum(TreeNode* root) {\n    // Write your code here\n}'), testCases: [{ input: '[-10,9,20,null,null,15,7]', expected: '42' }] },
    { id: 'd33q2', title: 'Construct from Preorder + Inorder', difficulty: 'Medium', topic: 'Binary Tree', topicType: 'DSA', starterCode: cppStarter('TreeNode* buildTree(vector<int>& preorder, vector<int>& inorder) {\n    // Write your code here\n}'), testCases: [{ input: 'preorder=[3,9,20,15,7], inorder=[9,3,15,20,7]', expected: 'tree' }] },
    { id: 'd33q3', title: 'Morris Inorder Traversal', difficulty: 'Medium', topic: 'Binary Tree', topicType: 'DSA', starterCode: cppStarter('vector<int> morrisInorder(TreeNode* root) {\n    // Write your code here\n}'), testCases: [{ input: '[1,null,2,3]', expected: '[1,3,2]' }] },
    { id: 'd33q4', title: 'Flatten Binary Tree to Linked List', difficulty: 'Medium', topic: 'Binary Tree', topicType: 'DSA', starterCode: cppStarter('void flatten(TreeNode* root) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,5,3,4,null,6]', expected: 'right-skewed' }] },
    { id: 'd33q5', title: 'Lowest Common Ancestor', difficulty: 'Medium', topic: 'Binary Tree', topicType: 'DSA', starterCode: cppStarter('TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {\n    // Write your code here\n}'), testCases: [{ input: '[3,5,1,6,2,0,8]', expected: '3' }] },
  ],
  34: [
    { id: 'd34q1', title: 'Validate BST', difficulty: 'Medium', topic: 'BST', topicType: 'DSA', starterCode: cppStarter('bool isValidBST(TreeNode* root) {\n    // Write your code here\n}'), testCases: [{ input: '[2,1,3]', expected: 'true' }] },
    { id: 'd34q2', title: 'Search in BST', difficulty: 'Easy', topic: 'BST', topicType: 'DSA', starterCode: cppStarter('TreeNode* searchBST(TreeNode* root, int val) {\n    // Write your code here\n}'), testCases: [{ input: '[4,2,7,1,3], val=2', expected: 'node val=2' }] },
    { id: 'd34q3', title: 'Insert into BST', difficulty: 'Medium', topic: 'BST', topicType: 'DSA', starterCode: cppStarter('TreeNode* insertIntoBST(TreeNode* root, int val) {\n    // Write your code here\n}'), testCases: [{ input: '[4,2,7,1,3], val=5', expected: 'updated tree' }] },
    { id: 'd34q4', title: 'Kth Smallest in BST', difficulty: 'Medium', topic: 'BST', topicType: 'DSA', starterCode: cppStarter('int kthSmallest(TreeNode* root, int k) {\n    // Write your code here\n}'), testCases: [{ input: '[3,1,4,null,2], k=1', expected: '1' }] },
    { id: 'd34q5', title: 'LCA of BST', difficulty: 'Easy', topic: 'BST', topicType: 'DSA', starterCode: cppStarter('TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {\n    // Write your code here\n}'), testCases: [{ input: '[6,2,8,0,4,7,9], p=2, q=8', expected: '6' }] },
  ],
  35: [
    { id: 'd35q1', title: 'Floor in BST', difficulty: 'Easy', topic: 'BST', topicType: 'DSA', starterCode: cppStarter('int floorInBST(TreeNode* root, int key) {\n    // Write your code here\n}'), testCases: [{ input: '[10,5,15,2,6], key=7', expected: '6' }] },
    { id: 'd35q2', title: 'Ceil in BST', difficulty: 'Easy', topic: 'BST', topicType: 'DSA', starterCode: cppStarter('int ceilInBST(TreeNode* root, int key) {\n    // Write your code here\n}'), testCases: [{ input: '[10,5,15,2,6], key=7', expected: '10' }] },
    { id: 'd35q3', title: 'Two Sum in BST', difficulty: 'Medium', topic: 'BST', topicType: 'DSA', starterCode: cppStarter('bool findTarget(TreeNode* root, int k) {\n    // Write your code here\n}'), testCases: [{ input: '[5,3,6,2,4,null,7], k=9', expected: 'true' }] },
    { id: 'd35q4', title: 'Construct BST from Preorder', difficulty: 'Medium', topic: 'BST', topicType: 'DSA', starterCode: cppStarter('TreeNode* bstFromPreorder(vector<int>& preorder) {\n    // Write your code here\n}'), testCases: [{ input: '[8,5,1,7,10,12]', expected: 'BST' }] },
    { id: 'd35q5', title: 'Serialize and Deserialize BST', difficulty: 'Hard', topic: 'BST', topicType: 'DSA', starterCode: cppStarter('string serialize(TreeNode* root) {\n    // Write your code here\n}'), testCases: [{ input: '[2,1,3]', expected: 'serialized + deserialized' }] },
  ],
  36: [
    { id: 'd36q1', title: 'Kth Largest Element in Stream', difficulty: 'Easy', topic: 'Heaps', topicType: 'DSA', starterCode: cppStarter('class KthLargest {\n    // Write your code here\n}'), testCases: [{ input: 'k=3, [4,5,8,2]', expected: '[4,5,5]' }] },
    { id: 'd36q2', title: 'Kth Largest in Array', difficulty: 'Medium', topic: 'Heaps', topicType: 'DSA', starterCode: cppStarter('int findKthLargest(vector<int>& arr, int k) {\n    // Write your code here\n}'), testCases: [{ input: '[3,2,1,5,6,4], k=2', expected: '5' }] },
    { id: 'd36q3', title: 'Top K Frequent Elements', difficulty: 'Medium', topic: 'Heaps', topicType: 'DSA', starterCode: cppStarter('vector<int> topKFrequent(vector<int>& arr, int k) {\n    // Write your code here\n}'), testCases: [{ input: '[1,1,1,2,2,3], k=2', expected: '[1,2]' }] },
    { id: 'd36q4', title: 'Merge K Sorted Arrays', difficulty: 'Hard', topic: 'Heaps', topicType: 'DSA', starterCode: cppStarter('vector<int> mergeKArrays(vector<vector<int>>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[[1,4],[2,5],[3,6]]', expected: '[1,2,3,4,5,6]' }] },
    { id: 'd36q5', title: 'Find Median from Data Stream', difficulty: 'Hard', topic: 'Heaps', topicType: 'DSA', starterCode: cppStarter('class MedianFinder {\n    // Write your code here\n}'), testCases: [{ input: 'addNum(1),addNum(2),findMedian', expected: '1.5' }] },
  ],
  37: [
    { id: 'd37q1', title: 'Implement Trie (Prefix Tree)', difficulty: 'Medium', topic: 'Trie', topicType: 'DSA', starterCode: cppStarter('class Trie {\n    // Write your code here\n}'), testCases: [{ input: 'insert("apple"),search("apple")', expected: 'true' }] },
    { id: 'd37q2', title: 'Word Break (Trie)', difficulty: 'Medium', topic: 'Trie', topicType: 'DSA', starterCode: cppStarter('bool wordBreak(string s, vector<string>& dict) {\n    // Write your code here\n}'), testCases: [{ input: 's="leetcode", dict=["leet","code"]', expected: 'true' }] },
    { id: 'd37q3', title: 'Replace Words (Trie)', difficulty: 'Medium', topic: 'Trie', topicType: 'DSA', starterCode: cppStarter('string replaceWords(vector<string>& dict, string sentence) {\n    // Write your code here\n}'), testCases: [{ input: 'dict=["cat","bat"], sentence="the cattle"', expected: '"the cat"' }] },
    { id: 'd37q4', title: 'Longest Word in Dictionary', difficulty: 'Easy', topic: 'Trie', topicType: 'DSA', starterCode: cppStarter('string longestWord(vector<string>& words) {\n    // Write your code here\n}'), testCases: [{ input: '["w","wo","wor","worl","world"]', expected: '"world"' }] },
    { id: 'd37q5', title: 'Design Add and Search Words', difficulty: 'Medium', topic: 'Trie', topicType: 'DSA', starterCode: cppStarter('class WordDictionary {\n    // Write your code here\n}'), testCases: [{ input: 'addWord("bad"),search(".ad")', expected: 'true' }] },
    { id: 'd37q6', title: 'Maximum XOR of Two Numbers in Array', difficulty: 'Hard', topic: 'Trie', topicType: 'DSA', starterCode: cppStarter('int findMaximumXOR(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[3,10,5,25,2,8]', expected: '28' }] },
  ],
  38: [
    { id: 'd38q1', title: 'BFS of Graph', difficulty: 'Easy', topic: 'Graph', topicType: 'DSA', starterCode: cppStarter('vector<int> bfsOfGraph(int V, vector<int> adj[]) {\n    // Write your code here\n}'), testCases: [{ input: 'V=5, adj=[[1,2,3],[0],[0],[0],[2,3]]', expected: '[0,1,2,3,4]' }] },
    { id: 'd38q2', title: 'DFS of Graph', difficulty: 'Easy', topic: 'Graph', topicType: 'DSA', starterCode: cppStarter('vector<int> dfsOfGraph(int V, vector<int> adj[]) {\n    // Write your code here\n}'), testCases: [{ input: 'V=5, adj=[[1,2,3],[0],[0],[0],[2,3]]', expected: '[0,1,2,3,4]' }] },
    { id: 'd38q3', title: 'Number of Connected Components', difficulty: 'Medium', topic: 'Graph', topicType: 'DSA', starterCode: cppStarter('int countComponents(int n, vector<vector<int>>& edges) {\n    // Write your code here\n}'), testCases: [{ input: 'n=5, edges=[[0,1],[2,3]]', expected: '2' }] },
    { id: 'd38q4', title: 'Detect Cycle in Undirected Graph', difficulty: 'Medium', topic: 'Graph', topicType: 'DSA', starterCode: cppStarter('bool isCycle(int V, vector<int> adj[]) {\n    // Write your code here\n}'), testCases: [{ input: 'V=5, adj=[[1],[0,2,4],[1,3],[2,4],[1,3]]', expected: 'true' }] },
    { id: 'd38q5', title: 'Detect Cycle in Directed Graph', difficulty: 'Medium', topic: 'Graph', topicType: 'DSA', starterCode: cppStarter('bool isCyclic(int V, vector<int> adj[]) {\n    // Write your code here\n}'), testCases: [{ input: 'V=4, adj=[[1],[2],[3],[1]]', expected: 'true' }] },
  ],
  39: [
    { id: 'd39q1', title: 'Topological Sort (BFS/Kahn)', difficulty: 'Medium', topic: 'Graph', topicType: 'DSA', starterCode: cppStarter('vector<int> topoSort(int V, vector<int> adj[]) {\n    // Write your code here\n}'), testCases: [{ input: 'V=4, adj=[[],[0],[0,1],[0,2]]', expected: '[3,2,1,0]' }] },
    { id: 'd39q2', title: 'Course Schedule I', difficulty: 'Medium', topic: 'Graph', topicType: 'DSA', starterCode: cppStarter('bool canFinish(int n, vector<vector<int>>& pre) {\n    // Write your code here\n}'), testCases: [{ input: 'n=2, pre=[[1,0]]', expected: 'true' }] },
    { id: 'd39q3', title: 'Course Schedule II', difficulty: 'Medium', topic: 'Graph', topicType: 'DSA', starterCode: cppStarter('vector<int> findOrder(int n, vector<vector<int>>& pre) {\n    // Write your code here\n}'), testCases: [{ input: 'n=4, pre=[[1,0],[2,0],[3,1],[3,2]]', expected: '[0,1,2,3]' }] },
    { id: 'd39q4', title: 'Bipartite Graph Check', difficulty: 'Medium', topic: 'Graph', topicType: 'DSA', starterCode: cppStarter('bool isBipartite(vector<vector<int>>& graph) {\n    // Write your code here\n}'), testCases: [{ input: '[[1,3],[0,2],[1,3],[0,2]]', expected: 'true' }] },
    { id: 'd39q5', title: 'Number of Islands', difficulty: 'Medium', topic: 'Graph', topicType: 'DSA', starterCode: cppStarter('int numIslands(vector<vector<char>>& grid) {\n    // Write your code here\n}'), testCases: [{ input: '[["1","1","0"],["1","0","0"],["0","0","1"]]', expected: '2' }] },
  ],
  40: [
    { id: 'd40q1', title: 'Dijkstra Algorithm', difficulty: 'Medium', topic: 'Graph', topicType: 'DSA', starterCode: cppStarter('vector<int> dijkstra(int V, vector<vector<int>> adj[], int S) {\n    // Write your code here\n}'), testCases: [{ input: 'V=2, adj=[[[1,9]],[[0,9]]], S=0', expected: '[0,9]' }] },
    { id: 'd40q2', title: 'Bellman-Ford Algorithm', difficulty: 'Medium', topic: 'Graph', topicType: 'DSA', starterCode: cppStarter('vector<int> bellmanFord(int V, vector<vector<int>>& edges, int S) {\n    // Write your code here\n}'), testCases: [{ input: 'V=3, edges=[[0,1,5],[1,2,-2],[0,2,6]], S=0', expected: '[0,5,3]' }] },
    { id: 'd40q3', title: 'Network Delay Time', difficulty: 'Medium', topic: 'Graph', topicType: 'DSA', starterCode: cppStarter('int networkDelayTime(vector<vector<int>>& times, int n, int k) {\n    // Write your code here\n}'), testCases: [{ input: 'times=[[2,1,1],[2,3,1],[3,4,1]], n=4, k=2', expected: '2' }] },
    { id: 'd40q4', title: 'Cheapest Flights Within K Stops', difficulty: 'Medium', topic: 'Graph', topicType: 'DSA', starterCode: cppStarter('int findCheapestPrice(int n, vector<vector<int>>& flights, int src, int dst, int k) {\n    // Write your code here\n}'), testCases: [{ input: 'n=4, flights=[[0,1,100],[1,2,100],[2,3,100],[0,2,500]], src=0, dst=3, k=1', expected: '700' }] },
    { id: 'd40q5', title: 'Floyd Warshall', difficulty: 'Hard', topic: 'Graph', topicType: 'DSA', starterCode: cppStarter('void floydWarshall(vector<vector<int>>& dist) {\n    // Write your code here\n}'), testCases: [{ input: 'dist matrix', expected: 'all-pairs shortest' }] },
  ],
  41: [
    { id: 'd41q1', title: 'Shortest Path in Binary Matrix', difficulty: 'Medium', topic: 'Graph', topicType: 'DSA', starterCode: cppStarter('int shortestPathBinaryMatrix(vector<vector<int>>& grid) {\n    // Write your code here\n}'), testCases: [{ input: '[[0,1],[1,0]]', expected: '2' }] },
    { id: 'd41q2', title: '01 Matrix (BFS)', difficulty: 'Medium', topic: 'Graph', topicType: 'DSA', starterCode: cppStarter('vector<vector<int>> updateMatrix(vector<vector<int>>& mat) {\n    // Write your code here\n}'), testCases: [{ input: '[[0,0,0],[0,1,0],[1,1,1]]', expected: '[[0,0,0],[0,1,0],[1,2,1]]' }] },
    { id: 'd41q3', title: 'Walls and Gates (BFS)', difficulty: 'Medium', topic: 'Graph', topicType: 'DSA', starterCode: cppStarter('void wallsAndGates(vector<vector<int>>& rooms) {\n    // Write your code here\n}'), testCases: [{ input: 'rooms with INF, -1, 0', expected: 'distance to nearest gate' }] },
    { id: 'd41q4', title: 'Rotting Oranges', difficulty: 'Medium', topic: 'Graph', topicType: 'DSA', starterCode: cppStarter('int orangesRotting(vector<vector<int>>& grid) {\n    // Write your code here\n}'), testCases: [{ input: '[[2,1,1],[1,1,0],[0,1,1]]', expected: '4' }] },
    { id: 'd41q5', title: 'Word Ladder', difficulty: 'Hard', topic: 'Graph', topicType: 'DSA', starterCode: cppStarter('int ladderLength(string beginWord, string endWord, vector<string>& wordList) {\n    // Write your code here\n}'), testCases: [{ input: 'begin="hit", end="cog", list=["hot","dot","dog","lot","log","cog"]', expected: '5' }] },
  ],
  42: [
    { id: 'd42q1', title: 'Kruskal Algorithm (MST)', difficulty: 'Medium', topic: 'Graph', topicType: 'DSA', starterCode: cppStarter('int kruskal(int V, vector<vector<int>> adj[]) {\n    // Write your code here\n}'), testCases: [{ input: 'V=3, weighted graph', expected: 'MST weight' }] },
    { id: 'd42q2', title: 'Prim Algorithm (MST)', difficulty: 'Medium', topic: 'Graph', topicType: 'DSA', starterCode: cppStarter('int prim(int V, vector<vector<int>> adj[]) {\n    // Write your code here\n}'), testCases: [{ input: 'V=3, weighted graph', expected: 'MST weight' }] },
    { id: 'd42q3', title: 'Disjoint Set Union (DSU)', difficulty: 'Medium', topic: 'Graph', topicType: 'DSA', starterCode: cppStarter('class DSU {\n    // Write your code here\n}'), testCases: [{ input: 'union/find', expected: 'correct components' }] },
    { id: 'd42q4', title: 'Number of Operations to Connect', difficulty: 'Medium', topic: 'Graph', topicType: 'DSA', starterCode: cppStarter('int makeConnected(int n, vector<vector<int>>& connections) {\n    // Write your code here\n}'), testCases: [{ input: 'n=4, connections=[[0,1],[0,2],[1,2]]', expected: '1' }] },
    { id: 'd42q5', title: 'Accounts Merge (DSU)', difficulty: 'Medium', topic: 'Graph', topicType: 'DSA', starterCode: cppStarter('vector<vector<string>> accountsMerge(vector<vector<string>>& accounts) {\n    // Write your code here\n}'), testCases: [{ input: 'accounts with emails', expected: 'merged accounts' }] },
  ],
  43: [
    { id: 'd43q1', title: 'Climbing Stairs (DP)', difficulty: 'Easy', topic: 'DP', topicType: 'DSA', starterCode: cppStarter('int climbStairs(int n) {\n    // Write your code here\n}'), testCases: [{ input: 'n=3', expected: '3' }] },
    { id: 'd43q2', title: 'Unique Paths (Grid DP)', difficulty: 'Medium', topic: 'DP', topicType: 'DSA', starterCode: cppStarter('int uniquePaths(int m, int n) {\n    // Write your code here\n}'), testCases: [{ input: 'm=3, n=7', expected: '28' }] },
    { id: 'd43q3', title: 'Min Path Sum (Grid DP)', difficulty: 'Medium', topic: 'DP', topicType: 'DSA', starterCode: cppStarter('int minPathSum(vector<vector<int>>& grid) {\n    // Write your code here\n}'), testCases: [{ input: '[[1,3,1],[1,5,1],[4,2,1]]', expected: '7' }] },
    { id: 'd43q4', title: 'Best Time to Buy/Sell Stock I', difficulty: 'Easy', topic: 'DP', topicType: 'DSA', starterCode: cppStarter('int maxProfit(vector<int>& prices) {\n    // Write your code here\n}'), testCases: [{ input: '[7,1,5,3,6,4]', expected: '5' }] },
    { id: 'd43q5', title: 'Best Time to Buy/Sell Stock II', difficulty: 'Easy', topic: 'DP', topicType: 'DSA', starterCode: cppStarter('int maxProfit2(vector<int>& prices) {\n    // Write your code here\n}'), testCases: [{ input: '[7,1,5,3,6,4]', expected: '7' }] },
    { id: 'd43q6', title: "Ninja's Training (DP)", difficulty: 'Medium', topic: 'DP', topicType: 'DSA', starterCode: cppStarter('int ninjaTraining(vector<vector<int>>& points) {\n    // Write your code here\n}'), testCases: [{ input: '[[1,2,5],[3,1,1],[3,3,3]]', expected: '12' }] },
  ],
  44: [
    { id: 'd44q1', title: 'Best Time Buy/Sell Stock III', difficulty: 'Hard', topic: 'DP', topicType: 'DSA', starterCode: cppStarter('int maxProfit3(vector<int>& prices) {\n    // Write your code here\n}'), testCases: [{ input: '[3,3,5,0,0,3,1,4]', expected: '6' }] },
    { id: 'd44q2', title: 'Best Time Buy/Sell Stock IV', difficulty: 'Hard', topic: 'DP', topicType: 'DSA', starterCode: cppStarter('int maxProfit4(int k, vector<int>& prices) {\n    // Write your code here\n}'), testCases: [{ input: 'k=2, [3,2,6,5,0,3]', expected: '7' }] },
    { id: 'd44q3', title: 'Best Time Buy/Sell with Cooldown', difficulty: 'Medium', topic: 'DP', topicType: 'DSA', starterCode: cppStarter('int maxProfitCooldown(vector<int>& prices) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,3,0,2]', expected: '3' }] },
    { id: 'd44q4', title: 'House Robber', difficulty: 'Medium', topic: 'DP', topicType: 'DSA', starterCode: cppStarter('int rob(vector<int>& nums) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,3,1]', expected: '4' }] },
    { id: 'd44q5', title: 'House Robber II (Circular)', difficulty: 'Medium', topic: 'DP', topicType: 'DSA', starterCode: cppStarter('int rob2(vector<int>& nums) {\n    // Write your code here\n}'), testCases: [{ input: '[2,3,2]', expected: '3' }] },
  ],
  45: [
    { id: 'd45q1', title: 'Subset Sum (DP)', difficulty: 'Medium', topic: 'DP', topicType: 'DSA', starterCode: cppStarter('bool subsetSum(vector<int>& arr, int sum) {\n    // Write your code here\n}'), testCases: [{ input: '[3,34,4,12,5,2], sum=9', expected: 'true' }] },
    { id: 'd45q2', title: '0/1 Knapsack', difficulty: 'Medium', topic: 'DP', topicType: 'DSA', starterCode: cppStarter('int knapsack(int W, vector<int>& wt, vector<int>& val) {\n    // Write your code here\n}'), testCases: [{ input: 'W=50, wt=[10,20,30], val=[60,100,120]', expected: '220' }] },
    { id: 'd45q3', title: 'Partition Equal Subset Sum', difficulty: 'Medium', topic: 'DP', topicType: 'DSA', starterCode: cppStarter('bool canPartition(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[1,5,11,5]', expected: 'true' }] },
    { id: 'd45q4', title: 'Count of Subsets with Sum K', difficulty: 'Medium', topic: 'DP', topicType: 'DSA', starterCode: cppStarter('int countSubsets(vector<int>& arr, int k) {\n    // Write your code here\n}'), testCases: [{ input: '[1,2,2,3], k=3', expected: '3' }] },
    { id: 'd45q5', title: 'Minimum Subset Sum Difference', difficulty: 'Hard', topic: 'DP', topicType: 'DSA', starterCode: cppStarter('int minDifference(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[1,6,11,5]', expected: '1' }] },
  ],
  46: [
    { id: 'd46q1', title: 'Longest Increasing Subsequence', difficulty: 'Medium', topic: 'DP', topicType: 'DSA', starterCode: cppStarter('int lengthOfLIS(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[10,9,2,5,3,7,101,18]', expected: '4' }] },
    { id: 'd46q2', title: 'Longest Common Subsequence', difficulty: 'Medium', topic: 'DP', topicType: 'DSA', starterCode: cppStarter('int longestCommonSubsequence(string s1, string s2) {\n    // Write your code here\n}'), testCases: [{ input: '"abcde", "ace"', expected: '3' }] },
    { id: 'd46q3', title: 'Longest Common Substring', difficulty: 'Medium', topic: 'DP', topicType: 'DSA', starterCode: cppStarter('int longestCommonSubstring(string s1, string s2) {\n    // Write your code here\n}'), testCases: [{ input: '"abcdxyz", "xyzabcd"', expected: '4' }] },
    { id: 'd46q4', title: 'Longest Palindromic Subsequence', difficulty: 'Medium', topic: 'DP', topicType: 'DSA', starterCode: cppStarter('int longestPalindromeSubseq(string s) {\n    // Write your code here\n}'), testCases: [{ input: '"bbbab"', expected: '4' }] },
    { id: 'd46q5', title: 'Edit Distance', difficulty: 'Hard', topic: 'DP', topicType: 'DSA', starterCode: cppStarter('int minDistance(string word1, string word2) {\n    // Write your code here\n}'), testCases: [{ input: '"horse", "ros"', expected: '3' }] },
  ],
  47: [
    { id: 'd47q1', title: 'Longest String Chain', difficulty: 'Medium', topic: 'DP', topicType: 'DSA', starterCode: cppStarter('int longestStrChain(vector<string>& words) {\n    // Write your code here\n}'), testCases: [{ input: '["a","b","ba","bca","bda","bdca"]', expected: '4' }] },
    { id: 'd47q2', title: 'Bitonic Subsequence', difficulty: 'Hard', topic: 'DP', topicType: 'DSA', starterCode: cppStarter('int longestBitonicSubsequence(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[1,11,2,10,4,5,2,1]', expected: '6' }] },
    { id: 'd47q3', title: 'Min Insertions/Deletions', difficulty: 'Medium', topic: 'DP', topicType: 'DSA', starterCode: cppStarter('int minOperations(string s1, string s2) {\n    // Write your code here\n}'), testCases: [{ input: '"heap", "pea"', expected: '3' }] },
    { id: 'd47q4', title: 'Shortest Common Supersequence', difficulty: 'Hard', topic: 'DP', topicType: 'DSA', starterCode: cppStarter('int shortestCommonSupersequence(string s1, string s2) {\n    // Write your code here\n}'), testCases: [{ input: '"AGGTAB", "GXTXAYB"', expected: '9' }] },
    { id: 'd47q5', title: 'Wildcard Matching', difficulty: 'Hard', topic: 'DP', topicType: 'DSA', starterCode: cppStarter('bool isMatch(string s, string p) {\n    // Write your code here\n}'), testCases: [{ input: 's="aa", p="a*"', expected: 'true' }] },
  ],
  48: [
    { id: 'd48q1', title: 'MCM (Matrix Chain Multiplication)', difficulty: 'Hard', topic: 'DP', topicType: 'DSA', starterCode: cppStarter('int mcm(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[40,20,30,10,30]', expected: '26000' }] },
    { id: 'd48q2', title: 'Burst Balloons', difficulty: 'Hard', topic: 'DP', topicType: 'DSA', starterCode: cppStarter('int maxCoins(vector<int>& arr) {\n    // Write your code here\n}'), testCases: [{ input: '[3,1,5,8]', expected: '167' }] },
    { id: 'd48q3', title: 'KMP Pattern Matching', difficulty: 'Hard', topic: 'Strings', topicType: 'DSA', starterCode: cppStarter('int kmp(string text, string pattern) {\n    // Write your code here\n}'), testCases: [{ input: '"ABABDABACDABABC", "ABABC"', expected: '10' }] },
    { id: 'd48q4', title: 'Z-Function', difficulty: 'Hard', topic: 'Strings', topicType: 'DSA', starterCode: cppStarter('vector<int> zFunction(string s) {\n    // Write your code here\n}'), testCases: [{ input: '"aabcaabxaaaz"', expected: '[12,1,0,0,3,1,0,0,2,2,1,0]' }] },
    { id: 'd48q5', title: 'Rabin-Karp', difficulty: 'Hard', topic: 'Strings', topicType: 'DSA', starterCode: cppStarter('int rabinKarp(string text, string pattern) {\n    // Write your code here\n}'), testCases: [{ input: '"GEEKS FOR GEEKS", "GEEK"', expected: '0' }] },
  ],
  49: [
    { id: 'd49q1', title: 'Segment Tree — Range Sum', difficulty: 'Medium', topic: 'Segment Tree', topicType: 'DSA', starterCode: cppStarter('class SegmentTree {\n    // Write your code here\n}'), testCases: [{ input: 'arr=[1,3,5,7,9], query(2,4)', expected: '21' }] },
    { id: 'd49q2', title: 'Fenwick Tree (BIT)', difficulty: 'Medium', topic: 'Fenwick Tree', topicType: 'DSA', starterCode: cppStarter('class FenwickTree {\n    // Write your code here\n}'), testCases: [{ input: 'arr=[2,1,1,3,2], update(3,2), query(0,4)', expected: '9' }] },
    { id: 'd49q3', title: 'Count Primes (Sieve)', difficulty: 'Easy', topic: 'Maths', topicType: 'DSA', starterCode: cppStarter('int countPrimes(int n) {\n    // Write your code here\n}'), testCases: [{ input: 'n=10', expected: '4' }] },
    { id: 'd49q4', title: 'Prime Factorization', difficulty: 'Easy', topic: 'Maths', topicType: 'DSA', starterCode: cppStarter('vector<int> primeFactors(int n) {\n    // Write your code here\n}'), testCases: [{ input: 'n=12', expected: '[2,2,3]' }] },
    { id: 'd49q5', title: 'Weak Topics Catch-Up', difficulty: 'Easy', topic: 'Revision', topicType: 'DSA', description: 'Spend this block reviewing your Weak Topics list. Solve 1-2 problems from topics you marked as weak.', starterCode: cppStarter('// Review your weak topics list\n// Pick 1-2 problems from your weak areas and solve them cold') },
  ],
  50: [
    { id: 'd50q1', title: 'Design Parking Lot (LLD)', difficulty: 'Hard', topic: 'LLD', topicType: 'LLD', description: 'Design a Parking Lot system with multiple floors, vehicle types, and spot allocation.', starterCode: cppStarter('// Design Parking Lot system\n// Classes: Vehicle, ParkingSpot, ParkingFloor, ParkingLot\n// Implement: park(), unpark(), availableSpots()\n// Consider: different vehicle types, spot sizes, multiple floors') },
    { id: 'd50q2', title: 'Design Tic-Tac-Toe (LLD)', difficulty: 'Medium', topic: 'LLD', topicType: 'LLD', description: 'Design a Tic-Tac-Toe game with win detection and move validation.', starterCode: cppStarter('// Design Tic-Tac-Toe game\n// Classes: Game, Board, Player, Cell\n// Implement: makeMove(), checkWin(), checkDraw(), reset()') },
    { id: 'd50q3', title: 'Singleton Pattern', difficulty: 'Easy', topic: 'LLD', topicType: 'LLD', description: 'Implement the Singleton design pattern with thread safety.', starterCode: cppStarter('class Singleton {\n    // Implement thread-safe Singleton\n    // Ensure only one instance exists\n    // Provide global access point\n}') },
    { id: 'd50q4', title: 'Factory Pattern', difficulty: 'Easy', topic: 'LLD', topicType: 'LLD', description: 'Implement the Factory design pattern for creating different vehicle types.', starterCode: cppStarter('class VehicleFactory {\n    // Implement Factory pattern\n    // Create different vehicle types: Car, Bike, Truck\n    // Use abstract base class Vehicle\n}') },
    { id: 'd50q5', title: 'Observer Pattern', difficulty: 'Easy', topic: 'LLD', topicType: 'LLD', description: 'Implement the Observer pattern for a notification system.', starterCode: cppStarter('class Observer {\n    // Implement Observer pattern\n    // Subject: notify observers on state change\n    // Observers: subscribe/unsubscribe and update') },
  ],
  51: [
    { id: 'd51q1', title: 'Design Elevator System (LLD)', difficulty: 'Hard', topic: 'LLD', topicType: 'LLD', description: 'Design an Elevator system with multiple elevators, scheduling, and floor requests.', starterCode: cppStarter('// Design Elevator system\n// Classes: Elevator, Request, Floor, ElevatorController\n// Implement: requestElevator(), moveElevator(), schedulingAlgorithm()') },
    { id: 'd51q2', title: 'Strategy Pattern', difficulty: 'Easy', topic: 'LLD', topicType: 'LLD', description: 'Implement the Strategy pattern for different payment methods.', starterCode: cppStarter('class PaymentStrategy {\n    // Implement Strategy pattern\n    // Different payment methods: CreditCard, UPI, Cash\n    // Context class uses selected strategy') },
    { id: 'd51q3', title: 'Adapter Pattern', difficulty: 'Easy', topic: 'LLD', topicType: 'LLD', description: 'Implement the Adapter pattern to make incompatible interfaces work together.', starterCode: cppStarter('class Adapter {\n    // Implement Adapter pattern\n    // Adapt old payment API to new interface\n    // Bridge between incompatible interfaces') },
    { id: 'd51q4', title: 'Decorator Pattern', difficulty: 'Easy', topic: 'LLD', topicType: 'LLD', description: 'Implement the Decorator pattern for adding features to a coffee order.', starterCode: cppStarter('class Decorator {\n    // Implement Decorator pattern\n    // Base: Coffee\n    // Decorators: Milk, Sugar, WhippedCream\n    // Each adds cost and description') },
    { id: 'd51q5', title: 'SOLID Principles Implementation', difficulty: 'Medium', topic: 'LLD', topicType: 'LLD', description: 'Demonstrate all 5 SOLID principles with code examples.', starterCode: cppStarter('// Demonstrate SOLID principles:\n// S: Single Responsibility - each class does one thing\n// O: Open/Closed - extend without modifying\n// L: Liskov Substitution - subtypes replace base types\n// I: Interface Segregation - small, focused interfaces\n// D: Dependency Inversion - depend on abstractions') },
  ],
  52: [
    { id: 'd52q1', title: 'LRU Cache from Scratch (LLD)', difficulty: 'Hard', topic: 'LLD', topicType: 'LLD', description: 'Implement LRU Cache from scratch using HashMap + Doubly Linked List.', starterCode: cppStarter('class LRUCache {\n    // Implement LRU Cache from scratch\n    // Use HashMap + Doubly Linked List\n    // Operations: get(key), put(key, value)\n    // Evict least recently used when capacity exceeded\n}') },
    { id: 'd52q2', title: 'Design HashMap (LLD)', difficulty: 'Medium', topic: 'LLD', topicType: 'LLD', description: 'Design and implement a HashMap from scratch with collision handling.', starterCode: cppStarter('class MyHashMap {\n    // Implement HashMap from scratch\n    // Use array + linked list for collision handling\n    // Operations: put, get, remove\n    // Handle collisions with chaining') },
    { id: 'd52q3', title: 'Design Twitter Feed (LLD)', difficulty: 'Hard', topic: 'LLD', topicType: 'LLD', description: 'Design a Twitter-like feed system with tweets, followers, and timeline generation.', starterCode: cppStarter('// Design Twitter Feed system\n// Classes: User, Tweet, Feed, TwitterService\n// Implement: postTweet(), follow(), unfollow(), getNewsFeed()\n// Consider: timeline generation, pagination') },
    { id: 'd52q4', title: 'Design Browser History (LLD)', difficulty: 'Medium', topic: 'LLD', topicType: 'LLD', description: 'Design a browser history system with back/forward navigation.', starterCode: cppStarter('class BrowserHistory {\n    // Design browser history\n    // Operations: visit(url), back(steps), forward(steps)\n// Use doubly linked list or two stacks') },
    { id: 'd52q5', title: 'Design Snake and Ladder (LLD)', difficulty: 'Medium', topic: 'LLD', topicType: 'LLD', description: 'Design a Snake and Ladder game with board, dice, and players.', starterCode: cppStarter('// Design Snake and Ladder game\n// Classes: Board, Snake, Ladder, Player, Dice, Game\n// Implement: rollDice(), movePlayer(), checkWin()') },
  ],
  53: [
    { id: 'd53q1', title: 'Design URL Shortener (HLD)', difficulty: 'Hard', topic: 'HLD', topicType: 'HLD', description: 'Design a URL shortening service (like bit.ly) with high availability and scalability.', starterCode: cppStarter('// Design URL Shortener (HLD)\n// Components:\n// 1. API Gateway - REST API for shortening/redirecting\n// 2. URL Encoding Service - Base62 encoding\n// 3. Database - URL mappings (Cassandra/DynamoDB)\n// 4. Cache - Redis for hot URLs\n// 5. CDN - for redirect speed\n// Consider: 100M URLs/day, 10:1 read:write ratio') },
    { id: 'd53q2', title: 'Design Instagram (HLD)', difficulty: 'Hard', topic: 'HLD', topicType: 'HLD', description: 'Design Instagram with photo upload, feed generation, and social features.', starterCode: cppStarter('// Design Instagram (HLD)\n// Components:\n// 1. API Gateway / Load Balancer\n// 2. Photo Service - upload, storage (S3/CDN)\n// 3. Feed Service - timeline generation\n// 4. Social Service - likes, comments, follows\n// 5. Database - sharded by user_id\n// 6. Cache - Redis for feed, hot content\n// Consider: 100M users, 500M photos/day') },
    { id: 'd53q3', title: 'Design WhatsApp (HLD)', difficulty: 'Hard', topic: 'HLD', topicType: 'HLD', description: 'Design a chat application like WhatsApp with real-time messaging.', starterCode: cppStarter('// Design WhatsApp (HLD)\n// Components:\n// 1. Chat Server - WebSocket connections\n// 2. Message Queue - Kafka for message delivery\n// 3. Database - message store (sharded)\n// 4. Push Notification Service\n// 5. Media Storage - S3 for images/videos\n// Consider: end-to-end encryption, offline messages') },
    { id: 'd53q4', title: 'Scalability + CAP Theorem', difficulty: 'Medium', topic: 'HLD', topicType: 'HLD', description: 'Document scalability concepts and CAP theorem trade-offs with examples.', starterCode: cppStarter('// Scalability Concepts:\n// 1. Vertical vs Horizontal Scaling\n// 2. Load Balancing (round-robin, least-connections, consistent hashing)\n// 3. CAP Theorem: Consistency, Availability, Partition Tolerance\n//    - CP systems: prioritize consistency (HBase, MongoDB)\n//    - AP systems: prioritize availability (Cassandra, DynamoDB)\n// 4. Eventual Consistency vs Strong Consistency') },
    { id: 'd53q5', title: 'Caching + DB Replication/Sharding', difficulty: 'Medium', topic: 'HLD', topicType: 'HLD', description: 'Document caching strategies and database scaling techniques.', starterCode: cppStarter('// Caching Strategies:\n// 1. Write-through, write-behind, cache-aside\n// 2. Cache eviction: LRU, LFU, TTL\n// 3. Cache invalidation strategies\n//\n// Database Scaling:\n// 1. Read replicas for read-heavy workloads\n// 2. Sharding: range-based, hash-based, directory-based\n// 3. Consistent hashing for shard assignment\n// 4. Master-slave vs master-master replication') },
  ],
  54: [
    { id: 'd54q1', title: 'Timed Mock 1 (Mixed Easy)', difficulty: 'Easy', topic: 'Mock', topicType: 'Mock', description: 'Solve 3 easy problems within 15 minutes each. Simulate real interview pressure.', starterCode: cppStarter('// Timed Mock 1 - Easy Set\n// Time limit: 15 minutes per problem\n// Problems: Two Sum, Valid Parentheses, Merge Sorted Arrays\n// Track your time and accuracy') },
    { id: 'd54q2', title: 'Timed Mock 2 (Mixed Medium)', difficulty: 'Medium', topic: 'Mock', topicType: 'Mock', description: 'Solve 3 medium problems within 25 minutes each. Simulate real interview pressure.', starterCode: cppStarter('// Timed Mock 2 - Medium Set\n// Time limit: 25 minutes per problem\n// Problems: 3Sum, Longest Substring Without Repeating, Binary Tree Level Order\n// Track your time and accuracy') },
    { id: 'd54q3', title: 'Timed Mock 3 (Mixed Hard)', difficulty: 'Hard', topic: 'Mock', topicType: 'Mock', description: 'Solve 2 hard problems within 40 minutes each. Simulate real interview pressure.', starterCode: cppStarter('// Timed Mock 3 - Hard Set\n// Time limit: 40 minutes per problem\n// Problems: Median of Two Sorted Arrays, Word Ladder\n// Track your time and accuracy') },
    { id: 'd54q4', title: 'Resume Polish', difficulty: 'Easy', topic: 'Mock', topicType: 'Mock', description: 'Review and polish your resume. Focus on projects, DSA achievements, and impact statements.', starterCode: cppStarter('// Resume Polish Checklist:\n// 1. Single page, clean format\n// 2. Projects with impact metrics\n// 3. DSA achievements (contest ratings, problems solved)\n// 4. Skills section: languages, frameworks, tools\n// 5. Experience with STAR format bullet points') },
    { id: 'd54q5', title: 'Behavioral STAR Prep', difficulty: 'Easy', topic: 'Mock', topicType: 'Mock', description: 'Prepare STAR stories for common behavioral interview questions.', starterCode: cppStarter('// Behavioral STAR Stories:\n// Prepare stories for:\n// 1. Tell me about a challenging project\n// 2. Describe a conflict you resolved\n// 3. A time you failed and learned\n// 4. A time you went above and beyond\n// 5. How you handle tight deadlines\n// Format: Situation, Task, Action, Result') },
  ],
  55: [
    { id: 'd55q1', title: 'Final Revision — Weak Topics', difficulty: 'Easy', topic: 'Revision', topicType: 'Mock', description: 'Review your weak topics list. No new content today — just light revision and confidence building.', starterCode: cppStarter('// Final Day - Light Revision\n// 1. Review your Weak Topics list\n// 2. Re-solve 1-2 problems from your weakest areas\n// 3. Review key formulas and patterns\n// 4. Rest well — you have worked hard') },
    { id: 'd55q2', title: 'Confidence Review', difficulty: 'Easy', topic: 'Revision', topicType: 'Mock', description: 'Review your progress over 55 days. Acknowledge how far you have come.', starterCode: cppStarter('// Confidence Review:\n// 1. Count total problems solved\n// 2. Review your accuracy improvements\n// 3. List topics you are now confident in\n// 4. Plan your interview week ahead\n// 5. Trust your preparation') },
    { id: 'd55q3', title: 'Rest Day', difficulty: 'Easy', topic: 'Revision', topicType: 'Mock', description: 'Light revision only. No new content. Rest and recharge.', starterCode: cppStarter('// Rest Day:\n// - Light flashcard review (30 min max)\n// - Skim through your strongest topics\n// - Relax, hydrate, sleep well\n// - You are ready for interviews') },
  ],
}

const DSA_TOPICS: Record<number, string> = {
  1: 'Maths (all 13) + Arrays Basics + STL/Collections + File Handling',
  2: 'Maths continued + Arrays Basics',
  3: 'Recursion — theory to Fibonacci (12 topics)',
  4: 'Recursion — advanced (reverse stack, sort, power set, Tower of Hanoi)',
  5: 'Sorting — implement all 5 algorithms from scratch',
  6: 'Sorting — advanced (Dutch Flag, Kth largest, merge sorted)',
  7: 'Hashing (basics) + Strings (full section)',
  8: 'Arrays (linear search → rotations) + Matrix basics',
  9: 'Arrays Part 2 + Matrix operations',
  10: 'Two Pointers (Two Sum → Four Sum, Container with Water)',
  11: 'Two Pointers continued (3Sum Closest, Trapping Rain Water)',
  12: 'Hashing/Prefix Sum + Binary Search begins (Search X, Bounds)',
  13: 'Binary Search — Search, Bounds, Insert, Rotated Array, Peak',
  14: 'Binary Search — Koko, Aggressive Cows, Book Allocation, Nth Root',
  15: 'Binary Search — Median of 2 Arrays, Ship Packages, Rotated II',
  16: 'Backtracking — Subsets I/II, Combination Sum I/II, Phone Letters',
  17: 'Backtracking — Word Search, N-Queens, Sudoku, Rat in Maze, M-Coloring',
  18: 'Singly + Doubly Linked List — all operations',
  19: 'Linked List — cycle, palindrome, intersection, add two numbers',
  20: 'LL Logic Building — reverse K, flatten, clone with random',
  21: 'LL Medium — sort, partition, odd-even, swap pairs',
  22: 'LL Hard — merge K sorted, LRU Cache, random pointer copy',
  23: 'Bit Manipulation (7 topics)',
  24: 'Greedy — Activity Selection, Fractional Knapsack, Jobs, Platforms',
  25: 'Greedy — Jump Game, Gas Station, Candy, Task Scheduler',
  26: 'Sliding Window — fixed + variable (max sum, longest substring)',
  27: 'Sliding Window — advanced (fruits, permutation, nice subarrays)',
  28: 'Stack/Queue Implementation + basic FAQs (parens, min stack)',
  29: 'Stack FAQs — histogram, RPN, temperatures, asteroid collision',
  30: 'Stack/Queue FAQs Part 2 — sliding max, LRU, LFU, circular queue',
  31: 'Binary Tree Traversal (inorder/preorder/postorder/level) + max depth',
  32: 'Binary Tree — diameter, balanced, same, symmetric, path sum',
  33: 'BT Medium + Construction + Morris Traversal + LCA',
  34: 'BST — validate, search, insert, kth smallest, LCA',
  35: 'BST — floor, ceil, two sum, construct from preorder, serialize',
  36: 'Heaps — kth largest, top K frequent, merge K arrays, median stream',
  37: 'Trie — implement, word break, replace words, max XOR',
  38: 'Graph Traversal (BFS/DFS) + Cycles + Connected Components',
  39: 'Topological Sort + Course Schedule + Bipartite + Islands',
  40: 'Shortest Path — Dijkstra, Bellman-Ford, Floyd-Warshall',
  41: 'Shortest Path — BFS variants, Word Ladder, Rotting Oranges',
  42: 'MST (Kruskal/Prim) + Disjoint Set Union + Applications',
  43: 'DP intro + Grid DP + Stocks I/II + Ninja\'s Training',
  44: 'Stocks III/IV + Cooldown + House Robber I/II',
  45: 'DP Subsequences + 0/1 Knapsack + Partition + Min Difference',
  46: 'LIS + DP on Strings (LCS, LPS, Edit Distance)',
  47: 'DP on Strings — remaining (String Chain, Bitonic, Wildcard)',
  48: 'MCM DP + KMP/Z-function/Rabin-Karp',
  49: 'Segment/Fenwick basics + Maths-2 (primes, factorization) + Weak catch-up',
  50: 'LLD — SOLID, Singleton/Factory/Observer, Parking Lot, Tic-Tac-Toe',
  51: 'LLD — Elevator, Strategy/Adapter/Decorator, SOLID implementation',
  52: 'LLD — LRU from scratch, HashMap, Twitter/Browser History/Snake-Ladder',
  53: 'HLD — URL Shortener, Instagram, WhatsApp, CAP, Caching, Sharding',
  54: 'Timed mocks (mixed difficulty) + resume + behavioral STAR',
  55: 'Final light revision — weak topics only, rest, confidence review',
}

export function getDaySchedule(day: number): DaySchedule {
  const phase = getPhase(day)
  const fundamentals = getFundamentals(day)
  const revisionDays = getRevisionDays(day)
  const dsaTopic = DSA_TOPICS[day] || 'Review'
  const revisionTopics = revisionDays.length > 0
    ? revisionDays.map(d => `Day ${d}: ${DSA_TOPICS[d] || 'Review'}`).join(', ')
    : 'No revision today'

  return {
    dayNumber: day,
    date: getDateForDay(day),
    phase: phase.number,
    phaseName: phase.name,
    dsaTopic,
    fundamentalsTopic: fundamentals,
    revisionDays,
    blocks: createBlocks(day, dsaTopic, fundamentals, revisionTopics),
    questions: QUESTIONS[day] || [],
    isWeeklyPractice: day % 7 === 0,
  }
}

export function getAllDays(): DaySchedule[] {
  return Array.from({ length: 55 }, (_, i) => getDaySchedule(i + 1))
}

export function getTodayDayNumber(): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(PLAN_START_DATE)
  start.setHours(0, 0, 0, 0)
  const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(1, Math.min(55, diff + 1))
}

export function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM'
  const h = hour % 12 === 0 ? 12 : hour % 12
  return `${h}:${minute.toString().padStart(2, '0')} ${period}`
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins < 60) return `${mins}m ${secs}s`
  const hrs = Math.floor(mins / 60)
  const remMins = mins % 60
  return `${hrs}h ${remMins}m`
}

export function getTopicTypeColor(topicType: string): string {
  const colors: Record<string, string> = {
    'DSA': 'var(--blue)',
    'LLD': 'var(--pink)',
    'HLD': 'var(--red)',
    'Aptitude': 'var(--amber)',
    'System Design': 'var(--teal)',
    'OOP': 'var(--indigo)',
    'OS': 'var(--cyan)',
    'DBMS': 'var(--green)',
    'CN': 'var(--orange)',
    'SQL': 'var(--amber)',
    'Mock': 'var(--red)',
  }
  return colors[topicType] || 'var(--blue)'
}

export function getTopicTypeBadge(topicType: string): string {
  const badges: Record<string, string> = {
    'DSA': 'badge-info',
    'LLD': 'badge-pink',
    'HLD': 'badge-hard',
    'Aptitude': 'badge-medium',
    'System Design': 'badge-teal',
    'OOP': 'badge-indigo',
    'OS': 'badge-cyan',
    'DBMS': 'badge-easy',
    'CN': 'badge-orange',
    'SQL': 'badge-medium',
    'Mock': 'badge-hard',
  }
  return badges[topicType] || 'badge-info'
}
