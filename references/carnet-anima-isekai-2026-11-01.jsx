import React, { useMemo, useState } from "react";
import { Search, Layers, Gem, ChevronRight, ChevronLeft, Eye, EyeOff } from "lucide-react";

/* ============================================================
   DONNÉES — mises à jour par Claude au fil de la conversation
   ============================================================ */

// Nom du deck
const NOM_DECK = "Anima Isekai";

// Raretés : de la plus courante à la plus rare
const RARETES = [
  { id: "commune", nom: "Commune", couleur: "#8b93a1" },
  { id: "peu-commune", nom: "Peu commune", couleur: "#6fae8f" },
  { id: "rare", nom: "Rare", couleur: "#6b9bd1" },
  { id: "epique", nom: "Épique", couleur: "#a98bd6" },
  { id: "legendaire", nom: "Légendaire", couleur: "#d9a55b" },
];

// Groupes = familles de cartes
const GROUPES = [
  { id: "shonen", nom: "Shōnen" },
  { id: "seinen", nom: "Seinen" },
  { id: "shojo", nom: "Shōjo" },
];

// Cartes : { id, nom, contexte, rarete, groupe }
const R = ["commune", "peu-commune", "rare", "epique", "legendaire"];
const carte = (id, nom, niveau, groupe, contexte = "") => ({ id, nom, rarete: R[niveau - 1], groupe, contexte });

const CARTES = [
  // One Piece
  carte("op-matthieu", "Monkey D. Matthieu", 1, "shonen", "One Piece"),
  carte("op-eli", "Nico Eli", 1, "shonen", "One Piece"),
  carte("op-thomas", "Roronoa Thomas", 1, "shonen", "One Piece"),

  // Jujutsu Kaisen
  carte("jjk-matthieu", "Matthieu Itadori", 1, "shonen", "Jujutsu Kaisen"),
  carte("jjk-eli", "Eli Kugisaki", 1, "shonen", "Jujutsu Kaisen"),
  carte("jjk-thomas", "Thomas Fushiguro", 1, "shonen", "Jujutsu Kaisen"),
  carte("jjk-nana", "Nana Zen'in", 5, "shonen", "Jujutsu Kaisen"),

  // Blue Box
  carte("bb-matthieu", "Matthieu Inomata", 3, "shojo", "Blue Box"),
  carte("bb-eli", "Eli Kano", 3, "shojo", "Blue Box"),
  carte("bb-thomas", "Thomas Kasahara", 3, "shojo", "Blue Box"),

  // Spy x Family
  carte("sxf-thomas", "Thomas Forger", 2, "shonen", "Spy x Family"),
  carte("sxf-eli", "Eli Forger", 2, "shonen", "Spy x Family"),
  carte("sxf-matthieu", "Matthieu Forger", 2, "shonen", "Spy x Family"),

  // Pokémon
  carte("pkm-matthieu", "Matthieu dresseur Électrik", 4, "shonen", "Pokémon"),
  carte("pkm-thomas", "Thomas dresseur Roche", 4, "shonen", "Pokémon"),
  carte("pkm-eli", "Eli dresseuse Eau", 4, "shonen", "Pokémon"),

  // Naruto
  carte("nar-thomas", "Thomas Uzumaki", 3, "shonen", "Naruto"),
  carte("nar-eli", "Eli Haruno", 3, "shonen", "Naruto"),
  carte("nar-matthieu", "Matthieu Uchiwa", 3, "shonen", "Naruto"),

  // JoJo's Bizarre Adventure
  carte("jojo-thomas", "Thomas Giovanna", 4, "shonen", "JoJo's Bizarre Adventure"),
  carte("jojo-matthieu", "Matthieu Anasui", 4, "shonen", "JoJo's Bizarre Adventure"),
  carte("jojo-nana", "Nana Una", 5, "shonen", "JoJo's Bizarre Adventure"),
  carte("jojo-eli", "Eli Cujoh", 4, "shonen", "JoJo's Bizarre Adventure"),

  // Sakamoto Days
  carte("sd-matthieu", "Matthieu Asakura", 1, "shonen", "Sakamoto Days"),
  carte("sd-thomas", "Thomas Sakamoto", 1, "shonen", "Sakamoto Days"),
  carte("sd-eli", "Eli Lu", 1, "shonen", "Sakamoto Days"),
  carte("sd-nana", "Nana Sakamoto", 1, "shonen", "Sakamoto Days"),

  // Black Clover
  carte("bc-matthieu", "Matthieu Asta", 2, "shonen", "Black Clover"),
  carte("bc-thomas", "Thomas Grinberryall", 2, "shonen", "Black Clover"),
  carte("bc-eli", "Eli Silva", 2, "shonen", "Black Clover"),
  carte("bc-nana", "Nana Vermillion", 2, "shonen", "Black Clover"),

  // Frieren
  carte("fr-matthieu", "Matthieu Stark", 2, "shonen", "Frieren"),
  carte("fr-eli", "Eli Fern", 2, "shonen", "Frieren"),
  carte("fr-thomas", "Thomas Himmel", 2, "shonen", "Frieren"),
  carte("fr-nana", "Nana Frieren", 2, "shonen", "Frieren"),

  // Dandadan
  carte("dd-nana", "Nana Ayase", 1, "shonen", "Dandadan"),
  carte("dd-thomas", "Thomas Takakura", 1, "shonen", "Dandadan"),
  carte("dd-eli", "Eli Ayase", 2, "shonen", "Dandadan"),
  carte("dd-matthieu", "Matthieu Enjoji", 2, "shonen", "Dandadan"),

  // Demon Slayer
  carte("ds-thomas", "Thomas Kamado", 4, "shonen", "Demon Slayer"),
  carte("ds-matthieu", "Matthieu Agatsuma", 4, "shonen", "Demon Slayer"),
  carte("ds-eli", "Eli Tsuyuri", 4, "shonen", "Demon Slayer"),
  carte("ds-nana", "Nana Kamado", 5, "shonen", "Demon Slayer"),

  // Chainsaw Man
  carte("csm-matthieu", "Matthieu Denji", 1, "seinen", "Chainsaw Man"),
  carte("csm-eli", "Eli Makima", 5, "seinen", "Chainsaw Man"),
  carte("csm-thomas", "Thomas Hayakawa", 1, "seinen", "Chainsaw Man"),
  carte("csm-nana", "Nana Ange", 1, "seinen", "Chainsaw Man"),

  // Kiseijū
  carte("kis-arashi", "Matthieu Izumi", 3, "seinen", "Kiseijū"),
  carte("kis-eli", "Eli Murano", 3, "seinen", "Kiseijū"),

  // Chi. Du mouvement de la Terre
  carte("chi-nana", "Nana Draka", 3, "seinen", "Chi. Du mouvement de la Terre"),
  carte("chi-thomas", "Thomas Rafal", 3, "seinen", "Chi. Du mouvement de la Terre"),

  // Grand Blue
  carte("gb-thomas", "Thomas Kitahara", 1, "seinen", "Grand Blue"),
  carte("gb-matthieu", "Matthieu Imamura", 1, "seinen", "Grand Blue"),
  carte("gb-eli", "Eli Kotegawa", 1, "seinen", "Grand Blue"),
  carte("gb-nana", "Nana Yoshiwara", 1, "seinen", "Grand Blue"),

  // Sword of the Demon Hunter
  carte("sdh-thomas", "Thomas Jinya", 3, "seinen", "Sword of the Demon Hunter"),
  carte("sdh-matthieu", "Matthieu Akitsu", 2, "seinen", "Sword of the Demon Hunter"),
  carte("sdh-eli", "Eli Suzune", 2, "seinen", "Sword of the Demon Hunter"),
  carte("sdh-nana", "Nana Shirayuki", 4, "seinen", "Sword of the Demon Hunter"),

  // Kaguya-sama: Love is War
  carte("kag-thomas", "Thomas Shirogane", 3, "shojo", "Kaguya-sama: Love is War"),
  carte("kag-nana", "Nana Shinomiya", 3, "shojo", "Kaguya-sama: Love is War"),
  carte("kag-matthieu", "Matthieu Ishigami", 2, "shojo", "Kaguya-sama: Love is War"),
  carte("kag-eli", "Eli Iino", 2, "shojo", "Kaguya-sama: Love is War"),

  // Horimiya
  carte("hor-thomas", "Thomas Miyamura", 1, "shojo", "Horimiya"),
  carte("hor-nana", "Nana Hori", 1, "shojo", "Horimiya"),
  carte("hor-matthieu", "Matthieu Ishikawa", 1, "shojo", "Horimiya"),
  carte("hor-eli", "Eli Yoshikawa", 1, "shojo", "Horimiya"),

  // Fruits Basket
  carte("fb-thomas", "Thomas Sohma", 1, "shojo", "Fruits Basket"),
  carte("fb-nana", "Nana Kuragi", 1, "shojo", "Fruits Basket"),
  carte("fb-matthieu", "Matthieu Sohma", 1, "shojo", "Fruits Basket"),
  carte("fb-eli", "Eli Honda", 1, "shojo", "Fruits Basket"),

  // Nana
  carte("nanas-thomas", "Thomas Honjō", 2, "shojo", "Nana"),
  carte("nanas-nana", "Nana Osaki", 3, "shojo", "Nana"),
  carte("nanas-matthieu", "Matthieu Terashima", 2, "shojo", "Nana"),
  carte("nanas-eli", "Eli Komatsu", 2, "shojo", "Nana"),

  // My Dress-Up Darling
  carte("mdd-thomas", "Thomas Gojo", 1, "shojo", "My Dress-Up Darling"),
  carte("mdd-nana", "Nana Kitagawa", 1, "shojo", "My Dress-Up Darling"),
  carte("mdd-matthieu", "Matthieu Inui", 1, "shojo", "My Dress-Up Darling"),
  carte("mdd-eli", "Eli Inui", 1, "shojo", "My Dress-Up Darling"),

  // Haikyū!!
  carte("hq-thomas", "Thomas Hinata", 1, "shonen", "Haikyū!!"),
  carte("hq-nana", "Nana Shimizu", 1, "shonen", "Haikyū!!"),
  carte("hq-matthieu", "Matthieu Tsukishima", 1, "shonen", "Haikyū!!"),
  carte("hq-eli", "Eli Yachi", 1, "shonen", "Haikyū!!"),

  // Hunter × Hunter
  carte("hxh-thomas", "Thomas Kurapika", 2, "shonen", "Hunter × Hunter"),
  carte("hxh-nana", "Nana Freecss", 2, "shonen", "Hunter × Hunter"),
  carte("hxh-matthieu", "Matthieu Paradinight", 2, "shonen", "Hunter × Hunter"),
  carte("hxh-eli", "Eli Zoldyck", 4, "shonen", "Hunter × Hunter"),

  // My Hero Academia
  carte("mha-thomas", "Thomas Iida", 1, "shonen", "My Hero Academia"),
  carte("mha-nana", "Nana Uraraka", 1, "shonen", "My Hero Academia"),
  carte("mha-matthieu", "Matthieu Kaminari", 1, "shonen", "My Hero Academia"),
  carte("mha-eli", "Eli Jirō", 1, "shonen", "My Hero Academia"),

  // Kaiju No. 8
  carte("k8-thomas", "Thomas Hoshina", 1, "shonen", "Kaiju No. 8"),
  carte("k8-nana", "Nana Okonogi", 1, "shonen", "Kaiju No. 8"),
  carte("k8-matthieu", "Matthieu Hibino", 1, "shonen", "Kaiju No. 8"),
  carte("k8-eli", "Eli Ashiro", 1, "shonen", "Kaiju No. 8"),

  // Blue Lock
  carte("bl-thomas", "Thomas Itoshi", 1, "shonen", "Blue Lock"),
  carte("bl-nana", "Nana Teieri", 1, "shonen", "Blue Lock"),
  carte("bl-matthieu", "Matthieu Nagi", 1, "shonen", "Blue Lock"),
  carte("bl-eli", "Eli Mikage", 1, "shonen", "Blue Lock"),

  // One Punch Man
  carte("opm-thomas", "Thomas Saitama", 5, "shonen", "One Punch Man"),
  carte("opm-nana", "Nana Tatsumaki", 2, "shonen", "One Punch Man"),
  carte("opm-matthieu", "Matthieu King", 1, "shonen", "One Punch Man"),
  carte("opm-eli", "Eli Fubuki", 1, "shonen", "One Punch Man"),

  // Dr. Stone
  carte("dst-thomas", "Thomas Ishigami", 1, "shonen", "Dr. Stone"),
  carte("dst-nana", "Nana Kohaku", 1, "shonen", "Dr. Stone"),
  carte("dst-matthieu", "Matthieu Ōki", 1, "shonen", "Dr. Stone"),
  carte("dst-eli", "Eli Ogawa", 1, "shonen", "Dr. Stone"),

  // Oshi no Ko
  carte("onk-thomas", "Thomas Hoshino", 3, "seinen", "Oshi no Ko"),
  carte("onk-nana", "Nana Kurokawa", 2, "seinen", "Oshi no Ko"),
  carte("onk-matthieu", "Matthieu Hoshino", 2, "seinen", "Oshi no Ko"),
  carte("onk-eli", "Eli Arima", 2, "seinen", "Oshi no Ko"),

  // Dungeon Meshi
  carte("dm-thomas", "Thomas Tims", 1, "seinen", "Dungeon Meshi"),
  carte("dm-nana", "Nana Donato", 1, "seinen", "Dungeon Meshi"),
  carte("dm-matthieu", "Matthieu Touden", 1, "seinen", "Dungeon Meshi"),
  carte("dm-eli", "Eli Touden", 1, "seinen", "Dungeon Meshi"),

  // Tokyo Ghoul
  carte("tg-thomas", "Thomas Arima", 2, "seinen", "Tokyo Ghoul"),
  carte("tg-nana", "Nana Kamishiro", 2, "seinen", "Tokyo Ghoul"),
  carte("tg-matthieu", "Matthieu Kaneki", 3, "seinen", "Tokyo Ghoul"),
  carte("tg-eli", "Eli Kirishima", 3, "seinen", "Tokyo Ghoul"),

  // Death Note
  carte("dn-thomas", "Thomas Yagami", 4, "seinen", "Death Note"),
  carte("dn-nana", "Nana Amane", 3, "seinen", "Death Note"),
  carte("dn-matthieu", "Matthieu Lawliet", 5, "seinen", "Death Note"),
  carte("dn-eli", "Eli Misora", 2, "seinen", "Death Note"),

  // Cowboy Bebop
  carte("cb-thomas", "Thomas Black", 2, "seinen", "Cowboy Bebop"),
  carte("cb-nana", "Nana Ed", 2, "seinen", "Cowboy Bebop"),
  carte("cb-matthieu", "Matthieu Spiegel", 4, "seinen", "Cowboy Bebop"),
  carte("cb-eli", "Eli Valentine", 3, "seinen", "Cowboy Bebop"),

  // Air Gear
  carte("ag-thomas", "Thomas Minami", 2, "shonen", "Air Gear"),
  carte("ag-nana", "Nana Noyamano", 2, "shonen", "Air Gear"),

  // Sun-Ken Rock
  carte("skr-matthieu", "Matthieu Kitano", 3, "seinen", "Sun-Ken Rock"),
  carte("skr-eli", "Eli Yoshizawa", 3, "seinen", "Sun-Ken Rock"),

  // Dumbbell
  carte("db-thomas", "Thomas Sōryūin", 1, "shonen", "Dumbbell"),
  carte("db-matthieu", "Matthieu Sakura", 1, "shonen", "Dumbbell"),
  carte("db-eli", "Eli Uehara", 1, "shonen", "Dumbbell"),
  carte("db-nana", "Nana Boyd", 1, "shonen", "Dumbbell"),

  // UQ Holder!
  carte("uq-matthieu", "Matthieu Konoe", 1, "shonen", "UQ Holder!"),
  carte("uq-eli", "Eli Sakurame", 1, "shonen", "UQ Holder!"),
  carte("uq-thomas", "Thomas Tokisaka", 1, "shonen", "UQ Holder!"),
  carte("uq-nana", "Nana Yukihime", 1, "shonen", "UQ Holder!"),

  // Sakura, Saku
  carte("ss-nana", "Nana Fujigaya", 1, "shojo", "Sakura, Saku"),
  carte("ss-thomas", "Thomas Haruki", 1, "shojo", "Sakura, Saku"),

  // A Sign of Affection
  carte("soa-matthieu", "Matthieu Itsuomi", 1, "shojo", "A Sign of Affection"),
  carte("soa-eli", "Eli Itose", 1, "shojo", "A Sign of Affection"),
];

// Fiches détaillées : "création" (ce que la carte doit représenter / montrer)
// et "description" (le texte de la carte). Clé = id de la carte.
const FICHES = {
  // Création : « Référence à [anime] : [nom] incarnant [personnage], à partir des références fournies. »
  "op-matthieu": { creation: "Référence à One Piece : Matthieu incarnant Monkey D. Luffy, à partir des références fournies.", description: "Monkey D. Luffy\nOne Piece" },
  "op-eli": { creation: "Référence à One Piece : Eli incarnant Nico Robin, à partir des références fournies.", description: "Nico Robin\nOne Piece" },
  "op-thomas": { creation: "Référence à One Piece : Thomas incarnant Roronoa Zoro, à partir des références fournies.", description: "Roronoa Zoro\nOne Piece" },
  "jjk-matthieu": { creation: "Référence à Jujutsu Kaisen : Matthieu incarnant Yuji Itadori, à partir des références fournies.", description: "Yuji Itadori\nJujutsu Kaisen" },
  "jjk-eli": { creation: "Référence à Jujutsu Kaisen : Eli incarnant Nobara Kugisaki, à partir des références fournies.", description: "Nobara Kugisaki\nJujutsu Kaisen" },
  "jjk-thomas": { creation: "Référence à Jujutsu Kaisen : Thomas incarnant Megumi Fushiguro, à partir des références fournies.", description: "Megumi Fushiguro\nJujutsu Kaisen" },
  "jjk-nana": { creation: "Référence à Jujutsu Kaisen : Nana incarnant Maki Zen'in, à partir des références fournies.", description: "Maki Zen'in\nJujutsu Kaisen" },
  "bb-matthieu": { creation: "Référence à Blue Box : Matthieu incarnant Taiki Inomata, à partir des références fournies.", description: "Taiki Inomata\nBlue Box" },
  "bb-eli": { creation: "Référence à Blue Box : Eli incarnant Chinatsu Kano, à partir des références fournies.", description: "Chinatsu Kano\nBlue Box" },
  "bb-thomas": { creation: "Référence à Blue Box : Thomas incarnant Kyo Kasahara, à partir des références fournies.", description: "Kyo Kasahara\nBlue Box" },
  "sxf-thomas": { creation: "Référence à Spy x Family : Thomas incarnant Anya Forger, à partir des références fournies.", description: "Anya Forger\nSpy x Family" },
  "sxf-eli": { creation: "Référence à Spy x Family : Eli incarnant Yor Forger, à partir des références fournies.", description: "Yor Forger\nSpy x Family" },
  "sxf-matthieu": { creation: "Référence à Spy x Family : Matthieu incarnant Loid Forger, à partir des références fournies.", description: "Loid Forger\nSpy x Family" },
  "pkm-matthieu": { creation: "Référence à Pokémon : Matthieu incarnant Sacha, à partir des références fournies.", description: "Sacha\nPokémon" },
  "pkm-thomas": { creation: "Référence à Pokémon : Thomas incarnant Pierre, à partir des références fournies.", description: "Pierre\nPokémon" },
  "pkm-eli": { creation: "Référence à Pokémon : Eli incarnant Ondine, à partir des références fournies.", description: "Ondine\nPokémon" },
  "nar-thomas": { creation: "Référence à Naruto : Thomas incarnant Naruto Uzumaki, à partir des références fournies.", description: "Naruto Uzumaki\nNaruto" },
  "nar-eli": { creation: "Référence à Naruto : Eli incarnant Sakura Haruno, à partir des références fournies.", description: "Sakura Haruno\nNaruto" },
  "nar-matthieu": { creation: "Référence à Naruto : Matthieu incarnant Sasuke Uchiwa, à partir des références fournies.", description: "Sasuke Uchiwa\nNaruto" },
  "jojo-thomas": { creation: "Référence à JoJo's Bizarre Adventure : Thomas incarnant Giorno Giovanna, à partir des références fournies.", description: "Giorno Giovanna\nJoJo's Bizarre Adventure" },
  "jojo-matthieu": { creation: "Référence à JoJo's Bizarre Adventure : Matthieu incarnant Narciso Anasui, à partir des références fournies.", description: "Narciso Anasui\nJoJo's Bizarre Adventure" },
  "jojo-nana": { creation: "Référence à JoJo's Bizarre Adventure : Nana incarnant Trish Una, à partir des références fournies.", description: "Trish Una\nJoJo's Bizarre Adventure" },
  "jojo-eli": { creation: "Référence à JoJo's Bizarre Adventure : Eli incarnant Jolyne Cujoh, à partir des références fournies.", description: "Jolyne Cujoh\nJoJo's Bizarre Adventure" },
  "kis-arashi": { creation: "Référence à Kiseijū : Matthieu incarnant Shinichi Izumi, à partir des références fournies.", description: "Shinichi Izumi\nKiseijū" },
  "kis-eli": { creation: "Référence à Kiseijū : Eli incarnant Satomi Murano, à partir des références fournies.", description: "Satomi Murano\nKiseijū" },
  "chi-nana": { creation: "Référence à Chi. Du mouvement de la Terre : Nana incarnant Draka, à partir des références fournies.", description: "Draka\nChi. Du mouvement de la Terre" },
  "chi-thomas": { creation: "Référence à Chi. Du mouvement de la Terre : Thomas incarnant Rafal, à partir des références fournies.", description: "Rafal\nChi. Du mouvement de la Terre" },
  "sd-matthieu": { creation: "Référence à Sakamoto Days : Matthieu incarnant Shin Asakura, à partir des références fournies.", description: "Shin Asakura\nSakamoto Days" },
  "sd-thomas": { creation: "Référence à Sakamoto Days : Thomas incarnant Taro Sakamoto, à partir des références fournies.", description: "Taro Sakamoto\nSakamoto Days" },
  "sd-eli": { creation: "Référence à Sakamoto Days : Eli incarnant Lu Xiaotang, à partir des références fournies.", description: "Lu Xiaotang\nSakamoto Days" },
  "sd-nana": { creation: "Référence à Sakamoto Days : Nana incarnant Aoi Sakamoto, à partir des références fournies.", description: "Aoi Sakamoto\nSakamoto Days" },
  "bc-matthieu": { creation: "Référence à Black Clover : Matthieu incarnant Asta, à partir des références fournies.", description: "Asta\nBlack Clover" },
  "bc-thomas": { creation: "Référence à Black Clover : Thomas incarnant Yuno Grinberryall, à partir des références fournies.", description: "Yuno Grinberryall\nBlack Clover" },
  "bc-eli": { creation: "Référence à Black Clover : Eli incarnant Noelle Silva, à partir des références fournies.", description: "Noelle Silva\nBlack Clover" },
  "bc-nana": { creation: "Référence à Black Clover : Nana incarnant Mimosa Vermillion, à partir des références fournies.", description: "Mimosa Vermillion\nBlack Clover" },
  "fr-matthieu": { creation: "Référence à Frieren : Matthieu incarnant Stark, à partir des références fournies.", description: "Stark\nFrieren" },
  "fr-eli": { creation: "Référence à Frieren : Eli incarnant Fern, à partir des références fournies.", description: "Fern\nFrieren" },
  "fr-thomas": { creation: "Référence à Frieren : Thomas incarnant Himmel, à partir des références fournies.", description: "Himmel\nFrieren" },
  "fr-nana": { creation: "Référence à Frieren : Nana incarnant Frieren, à partir des références fournies.", description: "Frieren\nFrieren" },
  "gb-thomas": { creation: "Référence à Grand Blue : Thomas incarnant Iori Kitahara, à partir des références fournies.", description: "Iori Kitahara\nGrand Blue" },
  "gb-matthieu": { creation: "Référence à Grand Blue : Matthieu incarnant Kōhei Imamura, à partir des références fournies.", description: "Kōhei Imamura\nGrand Blue" },
  "gb-eli": { creation: "Référence à Grand Blue : Eli incarnant Chisa Kotegawa, à partir des références fournies.", description: "Chisa Kotegawa\nGrand Blue" },
  "gb-nana": { creation: "Référence à Grand Blue : Nana incarnant Aina Yoshiwara, à partir des références fournies.", description: "Aina Yoshiwara\nGrand Blue" },
  "dd-nana": { creation: "Référence à Dandadan : Nana incarnant Momo Ayase, à partir des références fournies.", description: "Momo Ayase\nDandadan" },
  "dd-thomas": { creation: "Référence à Dandadan : Thomas incarnant Ken Takakura, à partir des références fournies.", description: "Ken Takakura\nDandadan" },
  "dd-eli": { creation: "Référence à Dandadan : Eli incarnant Seiko Ayase, à partir des références fournies.", description: "Seiko Ayase\nDandadan" },
  "dd-matthieu": { creation: "Référence à Dandadan : Matthieu incarnant Jin Enjoji, à partir des références fournies.", description: "Jin Enjoji\nDandadan" },
  "ds-thomas": { creation: "Référence à Demon Slayer : Thomas incarnant Tanjiro Kamado, à partir des références fournies.", description: "Tanjiro Kamado\nDemon Slayer" },
  "ds-matthieu": { creation: "Référence à Demon Slayer : Matthieu incarnant Zenitsu Agatsuma, à partir des références fournies.", description: "Zenitsu Agatsuma\nDemon Slayer" },
  "ds-eli": { creation: "Référence à Demon Slayer : Eli incarnant Kanao Tsuyuri, à partir des références fournies.", description: "Kanao Tsuyuri\nDemon Slayer" },
  "ds-nana": { creation: "Référence à Demon Slayer : Nana incarnant Nezuko Kamado, à partir des références fournies.", description: "Nezuko Kamado\nDemon Slayer" },
  "sdh-thomas": { creation: "Référence à Sword of the Demon Hunter : Thomas incarnant Jinya, à partir des références fournies.", description: "Jinya\nSword of the Demon Hunter" },
  "sdh-matthieu": { creation: "Référence à Sword of the Demon Hunter : Matthieu incarnant Somegorō Akitsu, à partir des références fournies.", description: "Somegorō Akitsu\nSword of the Demon Hunter" },
  "sdh-eli": { creation: "Référence à Sword of the Demon Hunter : Eli incarnant Suzune, à partir des références fournies.", description: "Suzune\nSword of the Demon Hunter" },
  "sdh-nana": { creation: "Référence à Sword of the Demon Hunter : Nana incarnant Shirayuki, à partir des références fournies.", description: "Shirayuki\nSword of the Demon Hunter" },
  "csm-matthieu": { creation: "Référence à Chainsaw Man : Matthieu incarnant Denji, à partir des références fournies.", description: "Denji\nChainsaw Man" },
  "csm-eli": { creation: "Référence à Chainsaw Man : Eli incarnant Makima, à partir des références fournies.", description: "Makima\nChainsaw Man" },
  "csm-thomas": { creation: "Référence à Chainsaw Man : Thomas incarnant Aki Hayakawa, à partir des références fournies.", description: "Aki Hayakawa\nChainsaw Man" },
  "csm-nana": { creation: "Référence à Chainsaw Man : Nana incarnant le Démon de l'Ange, à partir des références fournies.", description: "Démon de l'Ange\nChainsaw Man" },
  "kag-thomas": { creation: "Référence à Kaguya-sama: Love is War : Thomas incarnant Miyuki Shirogane, à partir des références fournies.", description: "Miyuki Shirogane\nKaguya-sama: Love is War" },
  "kag-nana": { creation: "Référence à Kaguya-sama: Love is War : Nana incarnant Kaguya Shinomiya, à partir des références fournies.", description: "Kaguya Shinomiya\nKaguya-sama: Love is War" },
  "kag-matthieu": { creation: "Référence à Kaguya-sama: Love is War : Matthieu incarnant Yū Ishigami, à partir des références fournies.", description: "Yū Ishigami\nKaguya-sama: Love is War" },
  "kag-eli": { creation: "Référence à Kaguya-sama: Love is War : Eli incarnant Miko Iino, à partir des références fournies.", description: "Miko Iino\nKaguya-sama: Love is War" },
  "hor-thomas": { creation: "Référence à Horimiya : Thomas incarnant Izumi Miyamura, à partir des références fournies.", description: "Izumi Miyamura\nHorimiya" },
  "hor-nana": { creation: "Référence à Horimiya : Nana incarnant Kyōko Hori, à partir des références fournies.", description: "Kyōko Hori\nHorimiya" },
  "hor-matthieu": { creation: "Référence à Horimiya : Matthieu incarnant Tōru Ishikawa, à partir des références fournies.", description: "Tōru Ishikawa\nHorimiya" },
  "hor-eli": { creation: "Référence à Horimiya : Eli incarnant Yuki Yoshikawa, à partir des références fournies.", description: "Yuki Yoshikawa\nHorimiya" },
  "fb-thomas": { creation: "Référence à Fruits Basket : Thomas incarnant Yuki Sohma, à partir des références fournies.", description: "Yuki Sohma\nFruits Basket" },
  "fb-nana": { creation: "Référence à Fruits Basket : Nana incarnant Machi Kuragi, à partir des références fournies.", description: "Machi Kuragi\nFruits Basket" },
  "fb-matthieu": { creation: "Référence à Fruits Basket : Matthieu incarnant Kyō Sohma, à partir des références fournies.", description: "Kyō Sohma\nFruits Basket" },
  "fb-eli": { creation: "Référence à Fruits Basket : Eli incarnant Tohru Honda, à partir des références fournies.", description: "Tohru Honda\nFruits Basket" },
  "nanas-thomas": { creation: "Référence à Nana : Thomas incarnant Ren Honjō, à partir des références fournies.", description: "Ren Honjō\nNana" },
  "nanas-nana": { creation: "Référence à Nana : Nana incarnant Nana Osaki, à partir des références fournies.", description: "Nana Osaki\nNana" },
  "nanas-matthieu": { creation: "Référence à Nana : Matthieu incarnant Nobuo Terashima, à partir des références fournies.", description: "Nobuo Terashima\nNana" },
  "nanas-eli": { creation: "Référence à Nana : Eli incarnant Nana Komatsu, à partir des références fournies.", description: "Nana Komatsu\nNana" },
  "mdd-thomas": { creation: "Référence à My Dress-Up Darling : Thomas incarnant Wakana Gojo, à partir des références fournies.", description: "Wakana Gojo\nMy Dress-Up Darling" },
  "mdd-nana": { creation: "Référence à My Dress-Up Darling : Nana incarnant Marin Kitagawa, à partir des références fournies.", description: "Marin Kitagawa\nMy Dress-Up Darling" },
  "mdd-matthieu": { creation: "Référence à My Dress-Up Darling : Matthieu incarnant Shinju Inui, à partir des références fournies.", description: "Shinju Inui\nMy Dress-Up Darling" },
  "mdd-eli": { creation: "Référence à My Dress-Up Darling : Eli incarnant Sajuna Inui, à partir des références fournies.", description: "Sajuna Inui\nMy Dress-Up Darling" },
  "hq-thomas": { creation: "Référence à Haikyū!! : Thomas incarnant Shōyō Hinata, à partir des références fournies.", description: "Shōyō Hinata\nHaikyū!!" },
  "hq-nana": { creation: "Référence à Haikyū!! : Nana incarnant Kiyoko Shimizu, à partir des références fournies.", description: "Kiyoko Shimizu\nHaikyū!!" },
  "hq-matthieu": { creation: "Référence à Haikyū!! : Matthieu incarnant Kei Tsukishima, à partir des références fournies.", description: "Kei Tsukishima\nHaikyū!!" },
  "hq-eli": { creation: "Référence à Haikyū!! : Eli incarnant Hitoka Yachi, à partir des références fournies.", description: "Hitoka Yachi\nHaikyū!!" },
  "hxh-thomas": { creation: "Référence à Hunter × Hunter : Thomas incarnant Kurapika, à partir des références fournies.", description: "Kurapika\nHunter × Hunter" },
  "hxh-nana": { creation: "Référence à Hunter × Hunter : Nana incarnant Gon Freecss, à partir des références fournies.", description: "Gon Freecss\nHunter × Hunter" },
  "hxh-matthieu": { creation: "Référence à Hunter × Hunter : Matthieu incarnant Leorio Paradinight, à partir des références fournies.", description: "Leorio Paradinight\nHunter × Hunter" },
  "hxh-eli": { creation: "Référence à Hunter × Hunter : Eli incarnant Killua Zoldyck, à partir des références fournies.", description: "Killua Zoldyck\nHunter × Hunter" },
  "mha-thomas": { creation: "Référence à My Hero Academia : Thomas incarnant Tenya Iida, à partir des références fournies.", description: "Tenya Iida\nMy Hero Academia" },
  "mha-nana": { creation: "Référence à My Hero Academia : Nana incarnant Ochaco Uraraka, à partir des références fournies.", description: "Ochaco Uraraka\nMy Hero Academia" },
  "mha-matthieu": { creation: "Référence à My Hero Academia : Matthieu incarnant Denki Kaminari, à partir des références fournies.", description: "Denki Kaminari\nMy Hero Academia" },
  "mha-eli": { creation: "Référence à My Hero Academia : Eli incarnant Kyōka Jirō, à partir des références fournies.", description: "Kyōka Jirō\nMy Hero Academia" },
  "k8-thomas": { creation: "Référence à Kaiju No. 8 : Thomas incarnant Soshiro Hoshina, à partir des références fournies.", description: "Soshiro Hoshina\nKaiju No. 8" },
  "k8-nana": { creation: "Référence à Kaiju No. 8 : Nana incarnant Konomi Okonogi, à partir des références fournies.", description: "Konomi Okonogi\nKaiju No. 8" },
  "k8-matthieu": { creation: "Référence à Kaiju No. 8 : Matthieu incarnant Kafka Hibino, à partir des références fournies.", description: "Kafka Hibino\nKaiju No. 8" },
  "k8-eli": { creation: "Référence à Kaiju No. 8 : Eli incarnant Mina Ashiro, à partir des références fournies.", description: "Mina Ashiro\nKaiju No. 8" },
  "bl-thomas": { creation: "Référence à Blue Lock : Thomas incarnant Rin Itoshi, à partir des références fournies.", description: "Rin Itoshi\nBlue Lock" },
  "bl-nana": { creation: "Référence à Blue Lock : Nana incarnant Anri Teieri, à partir des références fournies.", description: "Anri Teieri\nBlue Lock" },
  "bl-matthieu": { creation: "Référence à Blue Lock : Matthieu incarnant Seishirō Nagi, à partir des références fournies.", description: "Seishirō Nagi\nBlue Lock" },
  "bl-eli": { creation: "Référence à Blue Lock : Eli incarnant Reo Mikage, à partir des références fournies.", description: "Reo Mikage\nBlue Lock" },
  "opm-thomas": { creation: "Référence à One Punch Man : Thomas incarnant Saitama, à partir des références fournies.", description: "Saitama\nOne Punch Man" },
  "opm-nana": { creation: "Référence à One Punch Man : Nana incarnant Tatsumaki, à partir des références fournies.", description: "Tatsumaki\nOne Punch Man" },
  "opm-matthieu": { creation: "Référence à One Punch Man : Matthieu incarnant King, à partir des références fournies.", description: "King\nOne Punch Man" },
  "opm-eli": { creation: "Référence à One Punch Man : Eli incarnant Fubuki, à partir des références fournies.", description: "Fubuki\nOne Punch Man" },
  "dst-thomas": { creation: "Référence à Dr. Stone : Thomas incarnant Senku Ishigami, à partir des références fournies.", description: "Senku Ishigami\nDr. Stone" },
  "dst-nana": { creation: "Référence à Dr. Stone : Nana incarnant Kohaku, à partir des références fournies.", description: "Kohaku\nDr. Stone" },
  "dst-matthieu": { creation: "Référence à Dr. Stone : Matthieu incarnant Taiju Ōki, à partir des références fournies.", description: "Taiju Ōki\nDr. Stone" },
  "dst-eli": { creation: "Référence à Dr. Stone : Eli incarnant Yuzuriha Ogawa, à partir des références fournies.", description: "Yuzuriha Ogawa\nDr. Stone" },
  "onk-thomas": { creation: "Référence à Oshi no Ko : Thomas incarnant Aqua Hoshino, à partir des références fournies.", description: "Aqua Hoshino\nOshi no Ko" },
  "onk-nana": { creation: "Référence à Oshi no Ko : Nana incarnant Akane Kurokawa, à partir des références fournies.", description: "Akane Kurokawa\nOshi no Ko" },
  "onk-matthieu": { creation: "Référence à Oshi no Ko : Matthieu incarnant Ruby Hoshino, à partir des références fournies.", description: "Ruby Hoshino\nOshi no Ko" },
  "onk-eli": { creation: "Référence à Oshi no Ko : Eli incarnant Kana Arima, à partir des références fournies.", description: "Kana Arima\nOshi no Ko" },
  "dm-thomas": { creation: "Référence à Dungeon Meshi : Thomas incarnant Chilchuck Tims, à partir des références fournies.", description: "Chilchuck Tims\nDungeon Meshi" },
  "dm-nana": { creation: "Référence à Dungeon Meshi : Nana incarnant Marcille Donato, à partir des références fournies.", description: "Marcille Donato\nDungeon Meshi" },
  "dm-matthieu": { creation: "Référence à Dungeon Meshi : Matthieu incarnant Laios Touden, à partir des références fournies.", description: "Laios Touden\nDungeon Meshi" },
  "dm-eli": { creation: "Référence à Dungeon Meshi : Eli incarnant Falin Touden, à partir des références fournies.", description: "Falin Touden\nDungeon Meshi" },
  "tg-thomas": { creation: "Référence à Tokyo Ghoul : Thomas incarnant Kishō Arima, à partir des références fournies.", description: "Kishō Arima\nTokyo Ghoul" },
  "tg-nana": { creation: "Référence à Tokyo Ghoul : Nana incarnant Rize Kamishiro, à partir des références fournies.", description: "Rize Kamishiro\nTokyo Ghoul" },
  "tg-matthieu": { creation: "Référence à Tokyo Ghoul : Matthieu incarnant Ken Kaneki, à partir des références fournies.", description: "Ken Kaneki\nTokyo Ghoul" },
  "tg-eli": { creation: "Référence à Tokyo Ghoul : Eli incarnant Touka Kirishima, à partir des références fournies.", description: "Touka Kirishima\nTokyo Ghoul" },
  "dn-thomas": { creation: "Référence à Death Note : Thomas incarnant Light Yagami, à partir des références fournies.", description: "Light Yagami\nDeath Note" },
  "dn-nana": { creation: "Référence à Death Note : Nana incarnant Misa Amane, à partir des références fournies.", description: "Misa Amane\nDeath Note" },
  "dn-matthieu": { creation: "Référence à Death Note : Matthieu incarnant L Lawliet, à partir des références fournies.", description: "L Lawliet\nDeath Note" },
  "dn-eli": { creation: "Référence à Death Note : Eli incarnant Naomi Misora, à partir des références fournies.", description: "Naomi Misora\nDeath Note" },
  "cb-thomas": { creation: "Référence à Cowboy Bebop : Thomas incarnant Jet Black, à partir des références fournies.", description: "Jet Black\nCowboy Bebop" },
  "cb-nana": { creation: "Référence à Cowboy Bebop : Nana incarnant Ed, à partir des références fournies.", description: "Ed\nCowboy Bebop" },
  "cb-matthieu": { creation: "Référence à Cowboy Bebop : Matthieu incarnant Spike Spiegel, à partir des références fournies.", description: "Spike Spiegel\nCowboy Bebop" },
  "cb-eli": { creation: "Référence à Cowboy Bebop : Eli incarnant Faye Valentine, à partir des références fournies.", description: "Faye Valentine\nCowboy Bebop" },
  "ag-thomas": { creation: "Référence à Air Gear : Thomas incarnant Itsuki Minami, à partir des références fournies.", description: "Itsuki Minami\nAir Gear" },
  "ag-nana": { creation: "Référence à Air Gear : Nana incarnant Ringo Noyamano, à partir des références fournies.", description: "Ringo Noyamano\nAir Gear" },
  "skr-matthieu": { creation: "Référence à Sun-Ken Rock : Matthieu incarnant Ken Kitano, à partir des références fournies.", description: "Ken Kitano\nSun-Ken Rock" },
  "skr-eli": { creation: "Référence à Sun-Ken Rock : Eli incarnant Yumi Yoshizawa, à partir des références fournies.", description: "Yumi Yoshizawa\nSun-Ken Rock" },
  "db-thomas": { creation: "Référence à Dumbbell : Thomas incarnant Akemi Sōryūin, à partir des références fournies.", description: "Akemi Sōryūin\nDumbbell" },
  "db-matthieu": { creation: "Référence à Dumbbell : Matthieu incarnant Hibiki Sakura, à partir des références fournies.", description: "Hibiki Sakura\nDumbbell" },
  "db-eli": { creation: "Référence à Dumbbell : Eli incarnant Ayaka Uehara, à partir des références fournies.", description: "Ayaka Uehara\nDumbbell" },
  "db-nana": { creation: "Référence à Dumbbell : Nana incarnant Gina Boyd, à partir des références fournies.", description: "Gina Boyd\nDumbbell" },
  "uq-matthieu": { creation: "Référence à UQ Holder! : Matthieu incarnant Tōta Konoe, à partir des références fournies.", description: "Tōta Konoe\nUQ Holder!" },
  "uq-eli": { creation: "Référence à UQ Holder! : Eli incarnant Kirie Sakurame, à partir des références fournies.", description: "Kirie Sakurame\nUQ Holder!" },
  "uq-thomas": { creation: "Référence à UQ Holder! : Thomas incarnant Kuromaru Tokisaka, à partir des références fournies.", description: "Kuromaru Tokisaka\nUQ Holder!" },
  "uq-nana": { creation: "Référence à UQ Holder! : Nana incarnant Yukihime, à partir des références fournies.", description: "Yukihime\nUQ Holder!" },
  "ss-nana": { creation: "Référence à Sakura, Saku : Nana incarnant Saku Fujigaya, à partir des références fournies.", description: "Saku Fujigaya\nSakura, Saku" },
  "ss-thomas": { creation: "Référence à Sakura, Saku : Thomas incarnant Haruki, à partir des références fournies.", description: "Haruki\nSakura, Saku" },
  "soa-matthieu": { creation: "Référence à A Sign of Affection : Matthieu incarnant Itsuomi Nagi, à partir des références fournies.", description: "Itsuomi Nagi\nA Sign of Affection" },
  "soa-eli": { creation: "Référence à A Sign of Affection : Eli incarnant Yuki Itose, à partir des références fournies.", description: "Yuki Itose\nA Sign of Affection" },
};

/* ============================================================ */

// Cartes dont l'illustration est terminée (id)
const ILLUSTREES = new Set([
  "op-matthieu", "op-eli", "op-thomas", "jjk-matthieu", "jjk-eli", "jjk-thomas", "jjk-nana", "bb-matthieu", "bb-eli", "bb-thomas", "sxf-thomas", "sxf-eli", "sxf-matthieu", "pkm-matthieu", "pkm-thomas", "pkm-eli", "nar-thomas", "nar-eli", "nar-matthieu", "jojo-thomas", "jojo-matthieu", "jojo-nana", "jojo-eli", "sd-matthieu", "sd-thomas", "sd-eli", "sd-nana", "bc-matthieu", "bc-thomas", "bc-eli", "bc-nana", "fr-matthieu", "fr-eli", "fr-thomas", "fr-nana", "dd-nana", "dd-thomas", "dd-eli", "dd-matthieu", "ds-thomas", "ds-matthieu", "ds-eli", "ds-nana", "csm-matthieu", "csm-eli", "csm-thomas", "csm-nana", "kis-arashi", "kis-eli", "chi-nana", "chi-thomas", "gb-thomas", "gb-matthieu", "gb-eli", "gb-nana", "sdh-thomas", "sdh-matthieu", "sdh-eli", "sdh-nana",
  "hq-thomas", "hq-nana", "hq-matthieu", "hq-eli", "hxh-thomas", "hxh-nana", "hxh-matthieu", "hxh-eli", "mha-thomas", "mha-nana", "mha-matthieu", "mha-eli", "k8-thomas", "k8-nana", "k8-matthieu", "k8-eli", "bl-thomas", "bl-nana", "bl-matthieu", "bl-eli", "opm-thomas", "opm-nana", "opm-matthieu", "opm-eli", "dst-thomas", "dst-nana", "dst-matthieu", "dst-eli", "ag-thomas", "ag-nana", "db-thomas", "db-matthieu", "db-eli", "db-nana", "uq-matthieu", "uq-eli", "uq-thomas", "uq-nana",
  "onk-thomas", "onk-nana", "onk-matthieu", "onk-eli", "dm-thomas", "dm-nana", "dm-matthieu", "dm-eli", "tg-thomas", "tg-nana", "tg-matthieu", "tg-eli", "dn-thomas", "dn-nana", "dn-matthieu", "dn-eli", "cb-thomas", "cb-nana", "cb-matthieu", "cb-eli", "skr-matthieu", "skr-eli",
  "kag-thomas", "kag-nana", "kag-matthieu", "kag-eli", "hor-thomas", "hor-nana", "hor-matthieu", "hor-eli", "fb-thomas", "fb-nana", "fb-matthieu", "fb-eli", "nanas-thomas", "nanas-nana", "nanas-matthieu", "nanas-eli", "mdd-thomas", "mdd-nana", "mdd-matthieu", "mdd-eli", "ss-nana", "ss-thomas", "soa-matthieu", "soa-eli",
]);

/* ============================================================ */

const SANS_GROUPE = "__aucun";

// Statut affiché par le point : illustrée (vert), illustrée sans fiche (contour blanc), fiche complète (ambre)
function statutCarte(id) {
  const ill = ILLUSTREES.has(id);
  const fiche = !!(FICHES[id]?.creation && FICHES[id]?.description);
  if (ill && fiche) return "illustree";
  if (ill) return "illustree-sans-fiche";
  if (fiche) return "fiche";
  return null;
}

function PointStatut({ statut }) {
  if (statut === "illustree")
    return <span aria-label="Illustration faite" className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />;
  if (statut === "illustree-sans-fiche")
    return <span aria-label="Illustration faite, fiche à compléter" className="h-2 w-2 shrink-0 rounded-full border border-zinc-200" />;
  if (statut === "fiche")
    return <span aria-label="Fiche complète" className="h-2 w-2 shrink-0 rounded-full bg-amber-500/80" />;
  return null;
}

const LIBELLE_STATUT = {
  illustree: { texte: "Illustration faite", cls: "text-emerald-400" },
  "illustree-sans-fiche": { texte: "Illustration faite · fiche à compléter", cls: "text-zinc-300" },
  fiche: { texte: "Fiche complète · illustration à faire", cls: "text-amber-500" },
};

function Pastille({ rarete, taille = 10 }) {
  if (!rarete) return null;
  return (
    <span
      className="inline-block rotate-45 rounded-sm shrink-0"
      style={{ width: taille, height: taille, background: rarete.couleur, boxShadow: `0 0 10px ${rarete.couleur}55` }}
    />
  );
}

function BlocFiche({ titre, texte }) {
  return (
    <section className="mb-4 rounded-2xl bg-zinc-900/80 px-4 py-4 ring-1 ring-zinc-800/80">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">{titre}</h3>
      {texte ? (
        <p className="whitespace-pre-line text-[15px] leading-relaxed text-zinc-300">{texte}</p>
      ) : (
        <p className="text-[15px] italic text-zinc-600">À définir</p>
      )}
    </section>
  );
}

function PageCarte({ carte, rarete, groupe, onRetour }) {
  const fiche = FICHES[carte.id] || {};
  const c = rarete?.couleur || "#52525b";
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-80"
        style={{ background: `radial-gradient(ellipse at 50% -10%, ${c}2e, transparent 70%)` }}
      />
      <div className="relative mx-auto max-w-lg px-4 pb-16">
        <nav className="sticky top-0 z-10 -mx-4 flex items-center bg-zinc-950/70 px-2 pt-3 pb-2 backdrop-blur-md">
          <button
            onClick={onRetour}
            className="flex min-h-11 items-center gap-0.5 rounded-full px-2 text-[16px] text-amber-500"
          >
            <ChevronLeft size={24} />
            Cartes
          </button>
        </nav>

        <header className="pt-6 pb-8">
          <div className="mb-5 h-1 w-20 rounded-full" style={{ background: c, boxShadow: `0 0 18px ${c}aa` }} />
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">{carte.nom}</h1>
          <p className="mt-2 text-sm">
            <span style={{ color: c }}>{rarete?.nom}</span>
            <span className="text-zinc-600"> · </span>
            <span className="text-zinc-500">{groupe ? groupe.nom : "Sans groupe"}</span>
          </p>
          {LIBELLE_STATUT[statutCarte(carte.id)] && (
            <p className={`mt-3 flex items-center gap-2 text-sm ${LIBELLE_STATUT[statutCarte(carte.id)].cls}`}>
              <PointStatut statut={statutCarte(carte.id)} />
              {LIBELLE_STATUT[statutCarte(carte.id)].texte}
            </p>
          )}
        </header>

        {carte.contexte && <BlocFiche titre="Mémo" texte={carte.contexte} />}
        <BlocFiche titre="Création" texte={fiche.creation} />
        <BlocFiche titre="Description" texte={fiche.description} />
      </div>
    </div>
  );
}

const ficheComplete = (id) => !!(FICHES[id]?.creation && FICHES[id]?.description);

export default function CarnetCartes() {
  const [recherche, setRecherche] = useState("");
  const [filtreRarete, setFiltreRarete] = useState("toutes");
  const [vue, setVue] = useState("groupes"); // groupes | rarete
  const [masquerIllustrees, setMasquerIllustrees] = useState(false);
  const [detail, setDetail] = useState(null);

  const rareteParId = useMemo(() => Object.fromEntries(RARETES.map((r) => [r.id, r])), []);
  const ordreRarete = useMemo(() => Object.fromEntries(RARETES.map((r, i) => [r.id, i])), []);
  const groupeParId = useMemo(() => Object.fromEntries(GROUPES.map((g) => [g.id, g])), []);

  const cartesFiltrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return CARTES.filter((c) => filtreRarete === "toutes" || c.rarete === filtreRarete)
      .filter((c) => !masquerIllustrees || !ILLUSTREES.has(c.id))
      .filter((c) => {
        if (!q) return true;
        const f = FICHES[c.id] || {};
        return [c.nom, c.contexte, f.creation, f.description].some((t) => (t || "").toLowerCase().includes(q));
      })
      .sort((a, b) => (ordreRarete[b.rarete] ?? -1) - (ordreRarete[a.rarete] ?? -1) || a.nom.localeCompare(b.nom));
  }, [recherche, filtreRarete, ordreRarete, masquerIllustrees]);

  const sections = useMemo(() => {
    if (vue === "rarete") {
      return [...RARETES]
        .reverse()
        .map((r) => ({ id: r.id, titre: r.nom, rarete: r, cartes: cartesFiltrees.filter((c) => c.rarete === r.id) }))
        .filter((s) => s.cartes.length);
    }
    const s = GROUPES.map((g) => ({ id: g.id, titre: g.nom, cartes: cartesFiltrees.filter((c) => c.groupe === g.id) }));
    const orphelines = cartesFiltrees.filter((c) => !groupeParId[c.groupe]);
    if (orphelines.length) s.push({ id: SANS_GROUPE, titre: "Sans groupe", cartes: orphelines });
    return s;
  }, [vue, cartesFiltrees, groupeParId]);

  const compteParRarete = useMemo(() => {
    const m = {};
    CARTES.forEach((c) => (m[c.rarete] = (m[c.rarete] || 0) + 1));
    return m;
  }, []);

  const nbCompletes = CARTES.filter((c) => ficheComplete(c.id)).length;
  const nbIllustrees = CARTES.filter((c) => ILLUSTREES.has(c.id)).length;

  if (detail) {
    return (
      <PageCarte
        carte={detail}
        rarete={rareteParId[detail.rarete]}
        groupe={groupeParId[detail.groupe]}
        onRetour={() => setDetail(null)}
      />
    );
  }

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-zinc-950 text-zinc-200"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif" }}
    >
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-64 opacity-60"
        style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(217,165,91,0.12), transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-lg px-4 pb-16">
        <header className="pt-10 pb-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-500/80">Carnet de conception</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-50">{NOM_DECK}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {CARTES.length} cartes · {GROUPES.length} groupes · {nbCompletes} fiche{nbCompletes > 1 ? "s" : ""} complète
            {nbCompletes > 1 ? "s" : ""}
          </p>
          <div className="relative mt-3 h-1 overflow-hidden rounded-full bg-zinc-900">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-amber-500/70 transition-all"
              style={{ width: `${(CARTES.length ? nbCompletes / CARTES.length : 0) * 100}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-emerald-400 transition-all"
              style={{ width: `${(CARTES.length ? nbIllustrees / CARTES.length : 0) * 100}%` }}
            />
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><PointStatut statut="illustree" /> Illustrée · {nbIllustrees}</span>
            <span className="flex items-center gap-1.5"><PointStatut statut="fiche" /> Fiche complète · {nbCompletes}</span>
            <span className="flex items-center gap-1.5"><PointStatut statut="illustree-sans-fiche" /> Illustrée sans fiche</span>
          </div>
        </header>

        {/* Filtre par rareté */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          <button
            onClick={() => setFiltreRarete("toutes")}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-medium transition ${
              filtreRarete === "toutes"
                ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/40"
                : "bg-zinc-900 text-zinc-400 ring-1 ring-zinc-800"
            }`}
          >
            Toutes
          </button>
          {RARETES.map((r) => {
            const actif = filtreRarete === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setFiltreRarete(actif ? "toutes" : r.id)}
                className="flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition"
                style={{
                  background: actif ? `${r.couleur}22` : "rgb(24 24 27)",
                  color: actif ? r.couleur : "rgb(161 161 170)",
                  boxShadow: `inset 0 0 0 1px ${actif ? r.couleur + "66" : "rgb(39 39 42)"}`,
                }}
              >
                <Pastille rarete={r} taille={8} />
                {r.nom}
                <span className="text-xs opacity-60">{compteParRarete[r.id] || 0}</span>
              </button>
            );
          })}
        </div>

        {/* Recherche */}
        <div className="mb-3 flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher une carte, une fiche…"
              className="w-full min-h-11 rounded-xl bg-zinc-800/80 border border-zinc-700/60 pl-10 pr-3.5 py-2.5 text-[16px] text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <button
            onClick={() => setMasquerIllustrees((v) => !v)}
            aria-pressed={masquerIllustrees}
            aria-label={masquerIllustrees ? "Afficher les cartes illustrées" : "Masquer les cartes illustrées"}
            title={masquerIllustrees ? "Afficher les cartes illustrées" : "Masquer les cartes illustrées"}
            className={`flex min-h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${
              masquerIllustrees
                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                : "border-zinc-700/60 bg-zinc-800/80 text-zinc-400"
            }`}
          >
            {masquerIllustrees ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {masquerIllustrees && (
          <p className="-mt-1 mb-3 px-1 text-xs text-emerald-400/80">Cartes illustrées masquées</p>
        )}

        {/* Vue */}
        <div className="mb-6 grid grid-cols-2 rounded-xl bg-zinc-900 p-1 ring-1 ring-zinc-800">
          {[
            { id: "groupes", label: "Par groupe", icone: Layers },
            { id: "rarete", label: "Par rareté", icone: Gem },
          ].map(({ id, label, icone: I }) => (
            <button
              key={id}
              onClick={() => setVue(id)}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium transition ${
                vue === id ? "bg-zinc-800 text-zinc-100 shadow" : "text-zinc-500"
              }`}
            >
              <I size={15} />
              {label}
            </button>
          ))}
        </div>

        {sections.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-800 px-6 py-12 text-center">
            <Gem className="mx-auto mb-3 text-zinc-700" size={28} />
            <p className="text-sm text-zinc-400">Aucune carte pour ce filtre.</p>
          </div>
        )}

        <div className="space-y-7">
          {sections.map((s) => (
            <section key={s.id}>
              <h2 className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {s.rarete && <Pastille rarete={s.rarete} taille={8} />}
                {s.titre}
                <span className="font-normal text-zinc-600">· {s.cartes.length}</span>
              </h2>

              <div className="overflow-hidden rounded-2xl bg-zinc-900/80 ring-1 ring-zinc-800/80">
                {s.cartes.length === 0 ? (
                  <p className="px-4 py-5 text-sm text-zinc-600">Aucune carte dans cette famille pour l'instant.</p>
                ) : (
                  s.cartes.map((c, i) => {
                    const r = rareteParId[c.rarete];
                    const g = groupeParId[c.groupe];
                    return (
                      <button
                        key={c.id}
                        onClick={() => setDetail(c)}
                        className={`flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition active:bg-zinc-800/80 ${
                          i > 0 ? "border-t border-zinc-800/70" : ""
                        }`}
                      >
                        <div
                          className="h-10 w-1 shrink-0 rounded-full"
                          style={{ background: r?.couleur || "#3f3f46", boxShadow: r ? `0 0 12px ${r.couleur}66` : "none" }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-medium text-zinc-100">{c.nom}</p>
                          {(c.contexte || (vue === "rarete" && g)) && (
                            <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500">
                              {vue === "rarete" && g ? g.nom + (c.contexte ? " · " : "") : ""}
                              {c.contexte}
                            </p>
                          )}
                        </div>
                        <PointStatut statut={statutCarte(c.id)} />
                        <ChevronRight size={18} className="shrink-0 text-zinc-700" />
                      </button>
                    );
                  })
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
