type
  Language* = enum
    lEnglish
    lCzech
  Phrase* = enum
    pDefinition
    pExample
    pProof
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
  pProof: [
    lEnglish: "Proof",
    lCzech: "Důkaz",
  ],
  pTheorem: [
    lEnglish: "Theorem",
    lCzech: "Věta",
  ],
]

func translate*(phrase: Phrase, lang: Language): string =
  translations[phrase][lang]
