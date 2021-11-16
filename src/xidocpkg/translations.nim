type
  Language* = enum
    lEnglish
    lCzech
  Phrase* = enum
    pDefinition
    pExample
    pExercise
    pProof
    pQuotation
    pSolution
    pTheorem

const translations* = [
  pDefinition: [
    lEnglish: "Definition",
    lCzech: "Definice",
  ],
  pExample: [
    lEnglish: "Example",
    lCzech: "Příklad",
  ],
  pExercise: [
    lEnglish: "Exercise",
    lCzech: "Cvičení",
  ],
  pProof: [
    lEnglish: "Proof",
    lCzech: "Důkaz",
  ],
  pQuotation: [
    lEnglish: "“$1”",
    lCzech: "„$1“"
  ],
  pSolution: [
    lEnglish: "Solution",
    lCzech: "Řešení",
  ],
  pTheorem: [
    lEnglish: "Theorem",
    lCzech: "Věta",
  ],
]

func translate*(phrase: Phrase, lang: Language): string =
  translations[phrase][lang]
