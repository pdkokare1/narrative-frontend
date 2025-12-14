// src/utils/VoiceAssets.ts

const CLOUD_BASE = "https://res.cloudinary.com/dphvvutwj/video/upload/the-gamut-audio";

interface IVoiceAssets {
  OPENERS: Record<string, Record<string, string[]>>;
  SEGUES: Record<string, string[]>;
  HANDOVERS: Record<string, string[]>;
  WELCOME_BACK: Record<string, string[]>;
}

export const VOICE_ASSETS: IVoiceAssets = {
  // --- SESSION OPENERS (Can be replaced by dynamic generation later) ---
  OPENERS: {
    MIRA: {
      MORNING: [`${CLOUD_BASE}/mira_open_morn_1.mp3`, `${CLOUD_BASE}/mira_open_morn_2.mp3`, `${CLOUD_BASE}/mira_open_morn_3.mp3`],
      AFTERNOON: [`${CLOUD_BASE}/mira_open_aft_1.mp3`, `${CLOUD_BASE}/mira_open_aft_2.mp3`, `${CLOUD_BASE}/mira_open_aft_3.mp3`],
      EVENING: [`${CLOUD_BASE}/mira_open_eve_1.mp3`, `${CLOUD_BASE}/mira_open_eve_2.mp3`, `${CLOUD_BASE}/mira_open_eve_3.mp3`]
    },
    RAJAT: {
      MORNING: [`${CLOUD_BASE}/rajat_open_morn_1.mp3`, `${CLOUD_BASE}/rajat_open_morn_2.mp3`, `${CLOUD_BASE}/rajat_open_morn_3.mp3`],
      AFTERNOON: [`${CLOUD_BASE}/rajat_open_aft_1.mp3`, `${CLOUD_BASE}/rajat_open_aft_2.mp3`, `${CLOUD_BASE}/rajat_open_aft_3.mp3`],
      EVENING: [`${CLOUD_BASE}/rajat_open_eve_1.mp3`, `${CLOUD_BASE}/rajat_open_eve_2.mp3`, `${CLOUD_BASE}/rajat_open_eve_3.mp3`]
    },
    SHUBHI: {
      MORNING: [`${CLOUD_BASE}/shubhi_open_morn_1.mp3`, `${CLOUD_BASE}/shubhi_open_morn_2.mp3`, `${CLOUD_BASE}/shubhi_open_morn_3.mp3`],
      AFTERNOON: [`${CLOUD_BASE}/shubhi_open_aft_1.mp3`, `${CLOUD_BASE}/shubhi_open_aft_2.mp3`, `${CLOUD_BASE}/shubhi_open_aft_3.mp3`],
      EVENING: [`${CLOUD_BASE}/shubhi_open_eve_1.mp3`, `${CLOUD_BASE}/shubhi_open_eve_2.mp3`, `${CLOUD_BASE}/shubhi_open_eve_3.mp3`]
    }
  },

  // --- SEGUES (Transitions between stories) ---
  SEGUES: {
    MIRA: [
      `${CLOUD_BASE}/mira_segue_01.mp3`, `${CLOUD_BASE}/mira_segue_02.mp3`, `${CLOUD_BASE}/mira_segue_03.mp3`,
      `${CLOUD_BASE}/mira_segue_04.mp3`, `${CLOUD_BASE}/mira_segue_05.mp3`, `${CLOUD_BASE}/mira_segue_06.mp3`,
      `${CLOUD_BASE}/mira_segue_07.mp3`, `${CLOUD_BASE}/mira_segue_08.mp3`, `${CLOUD_BASE}/mira_segue_09.mp3`,
      `${CLOUD_BASE}/mira_segue_10.mp3`
    ],
    RAJAT: [
      `${CLOUD_BASE}/rajat_segue_01.mp3`, `${CLOUD_BASE}/rajat_segue_02.mp3`, `${CLOUD_BASE}/rajat_segue_03.mp3`,
      `${CLOUD_BASE}/rajat_segue_04.mp3`, `${CLOUD_BASE}/rajat_segue_05.mp3`, `${CLOUD_BASE}/rajat_segue_06.mp3`,
      `${CLOUD_BASE}/rajat_segue_07.mp3`, `${CLOUD_BASE}/rajat_segue_08.mp3`, `${CLOUD_BASE}/rajat_segue_09.mp3`,
      `${CLOUD_BASE}/rajat_segue_10.mp3`
    ],
    SHUBHI: [
      `${CLOUD_BASE}/shubhi_segue_01.mp3`, `${CLOUD_BASE}/shubhi_segue_02.mp3`, `${CLOUD_BASE}/shubhi_segue_03.mp3`,
      `${CLOUD_BASE}/shubhi_segue_04.mp3`, `${CLOUD_BASE}/shubhi_segue_05.mp3`, `${CLOUD_BASE}/shubhi_segue_06.mp3`,
      `${CLOUD_BASE}/shubhi_segue_07.mp3`, `${CLOUD_BASE}/shubhi_segue_08.mp3`, `${CLOUD_BASE}/shubhi_segue_09.mp3`,
      `${CLOUD_BASE}/shubhi_segue_10.mp3`
    ]
  },

  // --- PLACEHOLDERS FOR FUTURE EXPANSION ---
  HANDOVERS: {
    MIRA_TO_RAJAT: [], MIRA_TO_SHUBHI: [],
    RAJAT_TO_MIRA: [], RAJAT_TO_SHUBHI: [],
    SHUBHI_TO_MIRA: [], SHUBHI_TO_RAJAT: []
  },
  
  WELCOME_BACK: {
    MIRA: [], RAJAT: [], SHUBHI: []
  }
};
