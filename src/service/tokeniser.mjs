import natural from "natural"

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

export function tokenize (input){
    return tokenizer.tokenize(input)
}
export function stem (input){
    return input.map(word => stemmer.stem(word))
}

export function analyseSentence(input){
    return stem(tokenize(input))
}

// Tokenization
// const sentence = "This is a sample sentence for natural language processing.";
// const tokens = tokenizer.tokenize(sentence);
// console.log('Tokens:', tokens);
//
// // Stemming
// const words = ['running', 'jumps', 'easily', 'fairly'];
// const stems = words.map(word => stemmer.stem(word));
// console.log('Stems:', stems);
//
// // Classification
// const classifier = new natural.BayesClassifier();
//
// classifier.addDocument('I love cats', 'positive');
// classifier.addDocument('I hate cats', 'negative');
// classifier.addDocument('Cats are the best', 'positive');
// classifier.addDocument('Cats are the worst', 'negative');
//
// classifier.train();
//
// console.log('Classification:', classifier.classify('I love my cat'));
// console.log('Classification:', classifier.classify('I dislike cats'));
