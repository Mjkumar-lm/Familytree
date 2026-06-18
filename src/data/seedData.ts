import type { FamilyMember, Relationship } from "../types";

const member = (
  id: string,
  name: string,
  generation: number,
  relationship: Relationship,
  parentId: string | null,
): FamilyMember => ({
  id,
  name,
  generation,
  relationship,
  parentId,
  notes: "",
  birth: "",
  death: "",
});

export const seedMembers: FamilyMember[] = [
  // G1 — Root
  member("jhanj-dev",     "Jhanj Dev",     1,  "Son",     null),

  // G2
  member("jagroop",       "Jagroop",       2,  "Son",     "jhanj-dev"),

  // G3
  member("himmat-singh",  "Himmat Singh",  3,  "Son",     "jagroop"),

  // G4
  member("lalu-ram",      "Lalu Ram",      4,  "Son",     "himmat-singh"),

  // G5
  member("radhu",         "Radhu",         5,  "Son",     "lalu-ram"),

  // G6
  member("sheoram",       "Sheoram",       6,  "Son",     "radhu"),

  // G7
  member("ghisa-ram",     "Ghisa Ram",     7,  "Son",     "sheoram"),

  // G8
  member("pat-ram",       "Pat Ram",       8,  "Son",     "ghisa-ram"),

  // G9
  member("kallu-ram",     "Kallu Ram",     9,  "Son",     "pat-ram"),

  // G10
  member("pohkar-ram",    "Pohkar Ram",    10, "Son",     "kallu-ram"),

  // G11
  member("bhipha-ram",    "Bhipha Ram",    11, "Son",     "pohkar-ram"),

  // G12
  member("ladhu-ram",     "Ladhu Ram",     12, "Son",     "bhipha-ram"),

  // G13
  member("mangla-ram",    "Mangla Ram",    13, "Son",     "ladhu-ram"),
  member("bishna-ram",    "Bishna Ram",    13, "Brother", "ladhu-ram"),

  // G14
  member("khem-chand-14", "Khem Chand",   14, "Son",     "mangla-ram"),
  member("harji-ram",     "Harji Ram",     14, "Brother", "mangla-ram"),
  member("pahalad-ram",   "Pahalad Ram",   14, "Brother", "mangla-ram"),

  // G15
  member("bakhtawar",     "Bakhtawar",     15, "Son",     "khem-chand-14"),

  // G16
  member("tara-chand-16", "Tara Chand",   16, "Son",     "bakhtawar"),

  // G17
  member("bala-ram",      "Bala Ram",      17, "Son",     "tara-chand-16"),
  member("mamchand",      "Mamchand",      17, "Brother", "tara-chand-16"),
  member("sedu-ram",      "Sedu Ram",      17, "Brother", "tara-chand-16"),

  // G18
  member("chet-ram",      "Chet Ram",      18, "Son",     "bala-ram"),

  // G19
  member("kishan-sahey",  "Kishan Sahey",  19, "Son",     "chet-ram"),
  member("shadi-ram",     "Shadi Ram",     19, "Brother", "chet-ram"),

  // G20
  member("khemchand-20",  "Khemchand",     20, "Son",     "kishan-sahey"),
  member("paras-ram",     "Paras Ram",     20, "Brother", "kishan-sahey"),
  member("mohan-singh",   "Mohan Singh",   20, "Brother", "kishan-sahey"),

  // G21
  member("tota-ram",      "Tota Ram",      21, "Son",     "khemchand-20"),
  member("prabhu-dayal",  "Prabhu Dayal",  21, "Brother", "khemchand-20"),
  member("madu-ram",      "Madu Ram",      21, "Brother", "khemchand-20"),
  member("gopal",         "Gopal",         21, "Brother", "khemchand-20"),

  // G22
  member("heera-lal",     "Heera Lal",     22, "Son",     "tota-ram"),
  member("jai-dayal",     "Jai Dayal",     22, "Brother", "tota-ram"),
  member("parvati-devi",  "Parvati Devi",  22, "Sister",  "tota-ram"),
];
