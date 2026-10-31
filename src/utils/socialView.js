import { normalize } from "./finance.js";
import { OCCASIONS } from "./social.js";

/** Pure presentation selectors. Source amounts remain in VND. */
export function filterSocialPeople(people, { search = "", group = "", occasion = "" } = {}) {
  const term = normalize(search);
  return people.filter((person) =>
    (!group || person.group === group) &&
    normalize(person.name).includes(term) &&
    (!occasion || person.entries.some((entry) => entry.occasion === occasion)),
  );
}

export function socialDirectionSummary(entries, direction, occasion = "") {
  const relevant = entries.filter((entry) =>
    entry.direction === direction && (!occasion || entry.occasion === occasion),
  );
  const total = relevant.reduce((sum, entry) => sum + entry.amount, 0);
  const occasions = OCCASIONS.map(({ id, label }) => ({
    id,
    label,
    amount: relevant
      .filter((entry) => entry.occasion === id)
      .reduce((sum, entry) => sum + entry.amount, 0),
  })).filter((item) => item.amount > 0);
  return { total, occasions, count: relevant.length };
}
