type
  Language* = enum
    lEnglish
    lCzech
  Phrase* = enum
    pDefinition
    pExample
    pExercise
    pProof
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
