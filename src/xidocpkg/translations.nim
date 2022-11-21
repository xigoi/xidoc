type
  Language* = enum
    lEnglish
    lCzech
    lGerman
  Phrase* = enum
    pCorollary
    pDefinition
    pExample
    pExercise
    pHint
    pHtmlLanguageCode
    pLatexLanguageName
    pLemma
    pProof
    pQuotation
    pSolution
    pTheorem

const translations = [
  pCorollary: [
    lEnglish: "Corollary",
    lCzech: "Důsledek",
    lGerman: "Folgesatz",
  ],
  pDefinition: [
    lEnglish: "Definition",
    lCzech: "Definice",
    lGerman: "Definition",
  ],
  pExample: [
    lEnglish: "Example",
    lCzech: "Příklad",
    lGerman: "Beispiel",
  ],
  pExercise: [
    lEnglish: "Exercise",
    lCzech: "Cvičení",
    lGerman: "Übung",
  ],
  pHint: [
    lEnglish: "Hint",
    lCzech: "Nápověda",
    lGerman: "Hinweis",
  ],
  pHtmlLanguageCode: [
    lEnglish: "en",
    lCzech: "cs",
    lGerman: "de",
  ],
  pLatexLanguageName: [
    lEnglish: "english",
    lCzech: "czech",
    lGerman: "ngerman",
  ],
  pLemma: [
    lEnglish: "Lemma",
    lCzech: "Lemma",
    lGerman: "Lemma",
  ],
  pProof: [
    lEnglish: "Proof",
    lCzech: "Důkaz",
    lGerman: "Beweis",
  ],
  pQuotation: [
    lEnglish: "“$1”",
    lCzech: "„$1“",
    lGerman: "„$1“",
  ],
  pSolution: [
    lEnglish: "Solution",
    lCzech: "Řešení",
    lGerman: "Lösung",
  ],
  pTheorem: [
    lEnglish: "Theorem",
    lCzech: "Věta",
    lGerman: "Satz",
  ],
]

func translate*(phrase: Phrase, lang: Language): string =
  translations[phrase][lang]
