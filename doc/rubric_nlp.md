# Module: Natural Language Processing
Assignment: Sentiment Analysis Technical Report

Task brief:
Students build and evaluate a sentiment analysis system that classifies text as Positive / Negative or Positive / Neutral / Negative.

Requirements:
- Choose a dataset such as IMDB reviews, Twitter sentiment, or Amazon reviews.
- Describe dataset size, label distribution, and example samples.
- Describe a baseline method such as a lexicon approach or logistic regression.
- Describe an improved method such as TF-IDF with a linear model or embeddings with a neural model.
- Explain preprocessing and feature representation.
- Report accuracy, precision, recall, and F1.
- Show at least one confusion matrix.
- Identify at least 3 failure cases and explain why they fail.
- Discuss limitations such as domain shift, sarcasm, bias, and label noise.
- Avoid overclaiming and justify claims with evidence.

Deliverables:
- Technical report of 800-1500 words or structured notebook write-up.
- Optional link to code repository.

Grading notes:
- Score each rubric based on evidence in the submission.
- Cite specific parts of the submission with short phrases or section references.
- If a submission lacks enough evidence for a rubric, score conservatively and explain what evidence is missing.
- If rubrics are not available, provide general strengths and areas-to-refine feedback as fallback.

---

# Evaluation Rubrics

Problem framing and clarity:
Description: Defines the prediction task clearly and explains why the chosen binary or 3-class setup is appropriate.
Strong evidence: Clear objective, clear labels, motivation, constraints, and assumptions.
Score range: 0-10
Weight: 10
Skill tags: critical_thinking, stakeholder_awareness
Keywords: prediction task, binary, 3-class, labels, motivation, assumptions, scope

Dataset understanding and data literacy:
Description: Describes dataset composition and provides evidence of understanding the data.
Strong evidence: Dataset size, label distribution, examples, edge cases, and dataset limitations.
Score range: 0-15
Weight: 15
Skill tags: data_literacy, critical_thinking
Keywords: dataset size, label distribution, examples, edge cases, limitations, data quality

Methodology and technical depth:
Description: Explains model choices and system design, including at least one baseline and one improved method.
Strong evidence: Baseline, improved model, rationale, implementation detail, and reproducible explanation.
Score range: 0-20
Weight: 20
Skill tags: technical_understanding, tool_fluency
Keywords: baseline, logistic regression, TF-IDF, embeddings, model choice, implementation, reproducible

Preprocessing and feature representation:
Description: Explains how text is transformed into features and why those steps were chosen.
Strong evidence: Tokenization, normalization, stopwords, lemmatization or stemming, TF-IDF or embeddings, and tradeoffs.
Score range: 0-15
Weight: 15
Skill tags: technical_understanding, problem_decomposition
Keywords: tokenization, normalization, stopwords, lemmatization, stemming, TF-IDF, embeddings, features

Evaluation and evidence:
Description: Uses appropriate metrics and evidence to support claims about performance.
Strong evidence: Accuracy, precision, recall, F1, confusion matrix, interpretation, and comparison.
Score range: 0-20
Weight: 20
Skill tags: data_literacy, critical_thinking
Keywords: accuracy, precision, recall, F1, confusion matrix, validation, metrics, comparison

Error analysis and iteration:
Description: Identifies failure patterns and proposes concrete improvements.
Strong evidence: At least 3 failure cases, such as sarcasm, negation, domain shift, or ambiguous labels, with improvements tied to evidence.
Score range: 0-10
Weight: 10
Skill tags: critical_thinking, practical_problem_solving
Keywords: error analysis, failure case, sarcasm, negation, domain shift, improvement, false positive, false negative

Communication and structure:
Description: Report is well structured and easy to follow, with clear sections and concise writing.
Strong evidence: Logical flow, readable formatting, precise terminology, and appropriate technical tone.
Score range: 0-10
Weight: 10
Skill tags: communication, delivery_execution
Keywords: structure, report, section, terminology, clarity, technical tone, conclusion

Responsible communication and limitations:
Description: Acknowledges limitations and avoids overclaiming.
Strong evidence: Bias, label noise, domain shift, uncertainty, bounded claims, and responsible interpretation.
Score range: 0-10
Weight: 10
Skill tags: ethical_awareness, stakeholder_awareness, critical_thinking
Keywords: limitation, bias, label noise, domain shift, uncertainty, overclaiming, responsible
