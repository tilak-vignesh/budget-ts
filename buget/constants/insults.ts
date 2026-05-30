export const INSULTS = [
  "Congrats, you've officially lost control.",
  "Your wallet called. It's filing for a restraining order.",
  "Broke behavior detected.",
  "Even your future self is disappointed in you.",
  "That's not a budget, that's a suggestion you ignored.",
  "You spent HOW much?? Incredible.",
  "Please seek help. Financial help.",
  "Your ancestors saved up for land. You can't save for groceries.",
  "Bro… really?",
  "This is why we can't have nice things.",
  "You deserve this. Be proud of your brokeness you bitch."
];

export function randomInsult(): string {
  return INSULTS[Math.floor(Math.random() * INSULTS.length)];
}

export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
