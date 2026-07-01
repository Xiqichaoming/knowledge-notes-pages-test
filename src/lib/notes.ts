import type { CollectionEntry } from "astro:content";

export type NoteEntry = CollectionEntry<"notes">;

export interface CategoryGroup {
  slug: string;
  label: string;
  count: number;
  notes: NoteEntry[];
}

export interface TagGroup {
  slug: string;
  label: string;
  count: number;
  notes: NoteEntry[];
}

export const sortNotes = (notes: NoteEntry[]) =>
  [...notes].sort((left, right) => {
    const byUpdated = right.data.updated.localeCompare(left.data.updated);
    if (byUpdated !== 0) {
      return byUpdated;
    }

    const byTitle = left.data.title.localeCompare(right.data.title, "zh-CN");
    if (byTitle !== 0) {
      return byTitle;
    }

    return left.slug.localeCompare(right.slug);
  });

export const groupNotesByCategory = (notes: NoteEntry[]): CategoryGroup[] => {
  const groups = new Map<string, CategoryGroup>();

  for (const note of notes) {
    const existing = groups.get(note.data.category);
    if (existing) {
      existing.count += 1;
      existing.notes.push(note);
      continue;
    }

    groups.set(note.data.category, {
      slug: note.data.category,
      label: note.data.categoryLabel,
      count: 1,
      notes: [note]
    });
  }

  return [...groups.values()].sort((left, right) => left.label.localeCompare(right.label));
};

export const groupNotesByTag = (notes: NoteEntry[]): TagGroup[] => {
  const groups = new Map<string, TagGroup>();

  for (const note of notes) {
    for (const tag of note.data.tags) {
      const existing = groups.get(tag);
      if (existing) {
        existing.count += 1;
        existing.notes.push(note);
        continue;
      }

      groups.set(tag, {
        slug: tag,
        label: tag,
        count: 1,
        notes: [note]
      });
    }
  }

  return [...groups.values()].sort((left, right) => left.label.localeCompare(right.label));
};

export const buildPrevNext = (notes: NoteEntry[], slug: string) => {
  const index = notes.findIndex((note) => note.slug === slug);
  return {
    previous: index >= 0 ? notes[index + 1] ?? null : null,
    next: index > 0 ? notes[index - 1] ?? null : null
  };
};

export const buildRelated = (notes: NoteEntry[], current: NoteEntry, count = 3) => {
  const scored = notes
    .filter((note) => note.slug !== current.slug)
    .map((note) => {
      let score = 0;

      if (note.data.category === current.data.category) {
        score += 4;
      }

      for (const tag of note.data.tags) {
        if (current.data.tags.includes(tag)) {
          score += 2;
        }
      }

      return { note, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      const byUpdated = right.note.data.updated.localeCompare(left.note.data.updated);
      if (byUpdated !== 0) {
        return byUpdated;
      }

      return left.note.data.title.localeCompare(right.note.data.title, "zh-CN");
    });

  return scored.slice(0, count).map((item) => item.note);
};
