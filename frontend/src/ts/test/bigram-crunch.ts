import { Wordset } from "./wordset";

const bigramSamples = 200;
let totalBigramCount = 0;

const bigramScores: { [bigram: string]: BigramScore } = {};

class BigramScore {
  public average: number;
  public count: number;
  constructor() {
    this.average = 0.0;
    this.count = 0;
  }

  increment(): void {
    totalBigramCount++;
    this.count++;
    this.average = this.count / totalBigramCount;
  }

  decrement(): void {
    totalBigramCount--;
    this.count--;
    this.average = this.count / totalBigramCount;
  }
}

export function updateBigramScore(
  currentWord: string,
  currentInput: string | null,
  isCorrect: boolean
): void {
  if (!isCorrect) {
    const bigramStartIndex = (currentInput?.length ?? 0) - 1;
    const bigram = currentWord.slice(bigramStartIndex, bigramStartIndex + 2); // 2 is the bigram length
    if (bigram.length < 2) {
      // Sometimes single letter characters may be found reject them here.
      return;
    }
    if (!(bigram in bigramScores)) {
      bigramScores[bigram] = new BigramScore();
    }
    bigramScores[bigram]?.increment();
  }
}

function bigramScore(word: string): [number, string[]] {
  let total = 0.0;
  let numBigrams = 0;
  // Use a sliding window of size 2 over the characters of the word to construct bigrams
  let prevChar = ""; // Initialize with an empty string for the first character handling
  const bigrams: string[] = []; // Update the type of bigrams to be an array of strings
  word.split("").forEach((currentChar: string, index) => {
    if (index > 0) {
      // Ensure we have a pair to form a bigram
      const bigram = prevChar + currentChar; // Construct bigram from the previous and current character
      if (bigram in bigramScores) {
        total += (bigramScores[bigram] as BigramScore).average;
        numBigrams++;
        bigrams.push(bigram);
      }
    }
    prevChar = currentChar; // Update prevChar to be the currentChar for the next iteration
  });

  return [numBigrams > 0 ? total / numBigrams : 0.0, bigrams]; // Return the average or 0 if no bigrams found
}

export function getWord(wordset: Wordset): string {
  const sampleWords = [];
  for (let i = 0; i < bigramSamples; i++) {
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
  let selectedBigrams: string[] = [];

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
      const [newScore, bigramsFound] = bigramScore(word);
      if (newScore > highScore) {
        selectedWord = word;
        highScore = newScore;
        selectedBigrams = bigramsFound;
      }
    }
  }

  // If no word containing a weak bigram was selected, fall back to the highest scoring word
  if (selectedWord === "") {
    for (const word of sampleWords) {
      const [newScore, bigramsFound] = bigramScore(word);
      if (newScore > highScore) {
        selectedWord = word;
        highScore = newScore;
        selectedBigrams = bigramsFound;
      }
    }
  }
  if (selectedWord === "") {
    for (const bigram of selectedBigrams) {
      bigramScores[bigram]?.decrement();
    }
  }

  return selectedWord ?? sampleWords[0]; // Fallback to the first sampled word if none match criteria
}

// Debuging purposes.
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

  console.debug(
    "Current Bigram Scores Table:",
    JSON.stringify(bigramScoresForLogging, null, 2)
  );
  return true;
}
