export interface Assignment {
  id: number;
  object: "assignment";
  url: string;
  data_updated_at: string;
  data: {
    created_at: string;
    subject_id: number;
    subject_type: string;
    srs_stage: number;
    unlocked_at: string;
    started_at: string | null;
    passed_at: string | null;
    burned_at: string | null;
    available_at: string;
    resurrected_at: string | null;
    hidden: boolean;
  };
}

export interface Subject {
  id: number;
  object: string;
  url: string;
  data_updated_at: string;
  data: {
    amalgamation_subject_ids: number[];
    component_subject_ids: number[];
    visually_similar_subject_ids: number[];
    auxiliary_meanings: {
      meaning: string;
      type: string;
    }[];
    characters: string;
    character_images:
      | {
          url: string;
          metadata: {
            inline_styles: boolean;
          };
          content_type: string;
        }[]
      | undefined;
    created_at: string;
    document_url: string;
    hidden_at: string | null;
    lesson_position: number;
    level: number;
    meanings: {
      meaning: string;
      primary: boolean;
      accepted_answer: boolean;
    }[];
    meaning_mnemonic: string;
    meaning_hint: string | undefined;
    slug: string;
    spaced_repetition_system_id: number;
    readings:
      | {
          reading: string;
          primary: boolean;
          accepted_answer: boolean;
          type: string;
        }[]
      | undefined;
    reading_mnemonic: string | undefined;
    reading_hint: string | undefined;
  };
}

export interface AssignmentCollection {
  object: string;
  url: string;
  pages: {
    next_url: string | null;
    previous_url: string | null;
    per_page: number;
  };
  total_count: number;
  data_updated_at: string | null;
  data: Assignment[];
}

export interface GradedReview {
  subject_id: number;
  incorrect_meaning_answers: number;
  incorrect_reading_answers: number;
}

export interface SubjectGrade {
  [subjectId: number]: {
    incorrect_meaning_answers: number;
    incorrect_reading_answers: number;
    correct_meaning: boolean;
    correct_reading: boolean;
  };
}
