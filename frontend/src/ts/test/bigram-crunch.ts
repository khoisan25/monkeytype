import { Wordset } from "./wordset";

const perBigramCount = 50;
const bigramSamples = 20;
const incorrectBigramPenalty = 1;

const bigramScores: { [bigram: string]: BigramScore } = {};

class BigramScore {
  public average: number;
  public count: number;
  constructor() {
    this.average = 0.0;
    this.count = 0;
  }

  update(score: number): void {
    if (this.count < perBigramCount) {
      this.count++;
    }
    const adjustRate = 1.0 / this.count;
    this.average = score * adjustRate + this.average * (1 - adjustRate);
  }
}

export function updateBigramScore(
  currentChar: string,
  prevChar: string | null,
  isCorrect: boolean
): void {
  if (!isCorrect) {
    const score = incorrectBigramPenalty;

    const bigram = prevChar ? prevChar + currentChar : currentChar;
    if (!(bigram in bigramScores)) {
      bigramScores[bigram] = new BigramScore();
    }
    bigramScores[bigram]?.update(score);
  }
}

function bigramScore(word: string): number {
  let total = 0.0;
  let numBigrams = 0;

  // Use a sliding window of size 2 over the characters of the word to construct bigrams
  let prevChar = ""; // Initialize with an empty string for the first character handling
  word.split("").forEach((currentChar, index) => {
    if (index > 0) {
      // Ensure we have a pair to form a bigram
      const bigram = prevChar + currentChar; // Construct bigram from the previous and current character
      if (bigram in bigramScores) {
        total += (bigramScores[bigram] as BigramScore).average;
        numBigrams++;
      }
    }
    prevChar = currentChar; // Update prevChar to be the currentChar for the next iteration
  });

  return numBigrams > 0 ? total / numBigrams : 0.0; // Return the average or 0 if no bigrams found
}

export function getWord2(wordset: Wordset): string {
  let highScore;
  let randomWord = "";
  for (let i = 0; i < bigramSamples; i++) {
    const newWord = wordset.randomWord("normal");
    const newScore = bigramScore(newWord);
    if (i === 0 || highScore === undefined || newScore > highScore) {
      randomWord = newWord;
      highScore = newScore;
    }
  }
  return randomWord;
}

export function getWord(wordset: Wordset): string {
  const sampleWords = [];
  for (let i = 0; i < bigramSamples * 5; i++) {
    // Increase sample size to have a better chance of including weak bigrams
    sampleWords.push(wordset.randomWord("normal"));
  }

  // Identify weak bigrams: those with the highest scores or most occurrences of errors
  const weakBigrams = Object.keys(bigramScores)
    .sort(
      (a, b) =>
        (bigramScores[b]?.average ?? 0) - (bigramScores[a]?.average ?? 0)
    )
    .slice(0, 10);

  let highScore = -Infinity;
  let selectedWord = "";

  // Prefer words that contain any of the weak bigrams
  for (const word of sampleWords) {
    const wordBigrams = new Set();
    for (let i = 0; i < word.length - 1; i++) {
      if (word[i] && word[i + 1]) {
        wordBigrams.add((word[i] ?? "") + (word[i + 1] ?? ""));
      }
    }

    const containsWeakBigram = weakBigrams.some((bigram) =>
      wordBigrams.has(bigram)
    );
    if (containsWeakBigram) {
      const newScore = bigramScore(word);
      if (newScore > highScore) {
        selectedWord = word;
        highScore = newScore;
      }
    }
  }

  // If no word containing a weak bigram was selected, fall back to the highest scoring word
  if (selectedWord === "") {
    for (const word of sampleWords) {
      const newScore = bigramScore(word);
      if (newScore > highScore) {
        selectedWord = word;
        highScore = newScore;
      }
    }
  }

  return selectedWord ?? sampleWords[0]; // Fallback to the first sampled word if none match criteria
}

export function logBigramScores(): boolean {
  const bigramScoresForLogging: {
    [key: string]: { average: number; count: number };
  } = {};

  Object.keys(bigramScores).forEach((bigram) => {
    const score = bigramScores[bigram];
    if (score) {
      bigramScoresForLogging[bigram] = {
        average: score.average,
        count: score.count,
      };
    }
  });

  console.log(
    "Current Bigram Scores Table:",
    JSON.stringify(bigramScoresForLogging, null, 2)
  );
  return true;
}
