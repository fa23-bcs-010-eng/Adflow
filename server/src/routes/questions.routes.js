const router = require('express').Router();

// Simple static questions list
const QUESTIONS = [
  { id: 1, question: 'What is the capital of Pakistan?', answer: 'Islamabad' },
  { id: 2, question: 'Which year was AdFlow founded?', answer: '2024' },
  { id: 3, question: 'Which library is used for HTTP requests on the client?', answer: 'Axios' },
];

router.get('/random', (req, res) => {
  const random = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
  res.json(random);
});

module.exports = router;
