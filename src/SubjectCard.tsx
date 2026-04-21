import { useEffect, useState } from "react";
import {
  Button,
  Stack,
  Input,
  Field,
  Flex,
  Popover,
  Portal,
  Text,
  Accordion,
  Span,
  Mark,
  Heading,
} from "@chakra-ui/react";
import { mutationOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { Toaster, toaster } from "./components/ui/toaster";
import type { GradedReview, Subject, SubjectGrade } from "./interfaces";

async function postGrade(review: GradedReview, apiKey: string) {
  await fetch(`https://api.wanikani.com/v2/reviews`, {
    method: "POST",
    headers: {
      "Wanikani-Revision": "20170710",
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ review }),
  });
}

function postGradeOptions(review: GradedReview, apiKey: string) {
  return mutationOptions({
    mutationFn: () => postGrade(review, apiKey),
  });
}

export function SubjectCard({
  subject,
  grades,
  setGrades,
  completedSubjects,
  setCompletedSubjects,
}: {
  subject: Subject;
  grades: SubjectGrade;
  setGrades: React.Dispatch<React.SetStateAction<SubjectGrade>>;
  completedSubjects: number[];
  setCompletedSubjects: React.Dispatch<React.SetStateAction<number[]>>;
}) {
  const queryClient = useQueryClient();
  const apiKey: string =
    queryClient.getQueryData(["apiKey"]) ?? localStorage.getItem("apiKey") ?? "";
  const [meaningAnswer, setMeaningAnswer] = useState("");
  const [readingAnswer, setReadingAnswer] = useState("");

  const incorrectMeaningCount = grades[subject.id]?.incorrect_meaning_answers ?? 0;
  const incorrectReadingCount = grades[subject.id]?.incorrect_reading_answers ?? 0;
  const [correctReading, setCorrectReading] = useState(
    grades[subject.id]?.correct_reading ??
      (!subject.data.readings || subject.data.readings.length === 0),
  );
  const [correctMeaning, setCorrectMeaning] = useState(
    grades[subject.id]?.correct_meaning ?? false,
  );

  function parseMnemonics(mnemonic: string) {
    // The mnemonics contain wanikani-specific mark tags.
    // Replace them with the Chakra UI Mark component for better styling
    const colorMap: Record<string, string> = {
      vocabulary: "purple",
      radical: "blue",
      kanji: "pink",
      reading: "gray",
    };
    const tagRegex = /<(vocabulary|radical|kanji|reading)>(.*?)<\/\1>/g;
    const parts = mnemonic.split(tagRegex);
    return parts.map((part, index) => {
      // Because the regex has two capturing groups: (tag) and (content), the split
      // array will follow this pattern: [text, tag, content, text, tag, content...].
      // Every 3rd element starting from index 1 is a tag name
      if (index % 3 === 1) {
        const tagName = part;
        const content = parts[index + 1];
        return (
          <Mark key={index} variant="subtle" colorPalette={colorMap[tagName] || "gray"}>
            {content}
          </Mark>
        );
      }
      // Every 3rd element starting from index 2 is the content we already handled
      if (index % 3 === 2) return null;
      // Otherwise, it's just plain text
      return part;
    });
  }

  function displayReadingHint(subject: Subject) {
    if (!subject.data.readings || subject.data.readings.length === 0) {
      return null;
    }
    return (
      <Accordion.Item value="reading">
        <Accordion.ItemTrigger>
          <Span flex="1">Reading</Span>
          <Accordion.ItemIndicator />
        </Accordion.ItemTrigger>
        <Accordion.ItemContent>
          <Accordion.ItemBody>
            <Heading>
              {subject.data.readings[0].reading || "No reading available"}
            </Heading>
            <Text>{parseMnemonics(subject.data.reading_mnemonic || "")}</Text>
          </Accordion.ItemBody>
        </Accordion.ItemContent>
      </Accordion.Item>
    );
  }

  function displayHint() {
    if (incorrectMeaningCount >= 1 || incorrectReadingCount >= 1) {
      let defaultValue = "meaning";
      const primaryMeaning = subject.data.meanings.find((m) => m.primary);

      if (incorrectReadingCount >= incorrectMeaningCount) {
        defaultValue = "reading";
      }

      return (
        <Popover.Root lazyMount unmountOnExit>
          <Popover.Trigger asChild>
            <Button size="sm" variant="outline">
              Show hint
            </Button>
          </Popover.Trigger>
          <Portal>
            <Popover.Positioner>
              <Popover.Content>
                <Popover.Arrow />
                <Popover.Body>
                  <Accordion.Root collapsible defaultValue={[defaultValue]}>
                    <Accordion.Item value="meaning">
                      <Accordion.ItemTrigger>
                        <Span flex="1">Meaning</Span>
                        <Accordion.ItemIndicator />
                      </Accordion.ItemTrigger>
                      <Accordion.ItemContent>
                        <Accordion.ItemBody>
                          <Heading>{primaryMeaning?.meaning}</Heading>
                          <Text>{parseMnemonics(subject.data.meaning_mnemonic)}</Text>
                        </Accordion.ItemBody>
                      </Accordion.ItemContent>
                    </Accordion.Item>
                    {displayReadingHint(subject)}
                  </Accordion.Root>
                </Popover.Body>
              </Popover.Content>
            </Popover.Positioner>
          </Portal>
        </Popover.Root>
      );
    }
  }

  // Initialize the mutation for grading the review
  const mutation = useMutation({
    ...postGradeOptions(
      {
        subject_id: subject.id,
        incorrect_meaning_answers: grades[subject.id]?.incorrect_meaning_answers ?? 0,
        incorrect_reading_answers: grades[subject.id]?.incorrect_reading_answers ?? 0,
      },
      apiKey,
    ),
    onSuccess: () => {
      toaster.create({
        title: `Submitted review for ${subject.data.characters}`,
        description: `Incorrect Meanings: ${incorrectMeaningCount}, Incorrect Readings: ${incorrectReadingCount}`,
        type: "info",
      });
    },
    onError: (error) => {
      toaster.create({
        title: "Error submitting review",
        description: (error as Error).message,
        type: "error",
      });
    },
  });

  function checkMeaning(e: React.SubmitEvent) {
    e.preventDefault();
    // Check if the answer matches any accepted meaning
    let meaningCorrect = subject.data.meanings.some(
      (m) => m.accepted_answer && m.meaning.toLowerCase() === meaningAnswer.toLowerCase(),
    );
    // If not correct, check auxiliary meanings ("whitelist" is also correct)
    if (!meaningCorrect && subject.data.auxiliary_meanings) {
      meaningCorrect = subject.data.auxiliary_meanings.some(
        (m) =>
          m.type === "whitelist" &&
          m.meaning.toLowerCase() === meaningAnswer.toLowerCase(),
      );
    }
    if (meaningCorrect) {
      setCorrectMeaning(true);
      setGrades((prev) => ({
        ...prev,
        [subject.id]: { ...prev[subject.id], correct_meaning: true },
      }));
      toaster.create({ description: `Correct!`, type: "success" });
    } else {
      // If the answer is not correct, increment the incorrect meaning count for this subject
      setGrades((prev) => ({
        ...prev,
        [subject.id]: {
          ...prev[subject.id],
          incorrect_meaning_answers:
            (prev[subject.id]?.incorrect_meaning_answers ?? 0) + 1,
        },
      }));
      toaster.create({
        description: `Incorrect Meaning. Total Incorrect Meanings: ${(grades[subject.id]?.incorrect_meaning_answers ?? 0) + 1}`,
        type: "error",
      });
    }
  }

  function checkReading(e: React.SubmitEvent) {
    e.preventDefault();
    const readingCorrect = subject.data.readings
      ? subject.data.readings.some(
          (r) => r.accepted_answer && r.reading === readingAnswer,
        )
      : true; // If there are no readings, consider it correct
    if (readingCorrect) {
      setCorrectReading(true);
      setGrades((prev) => ({
        ...prev,
        [subject.id]: { ...prev[subject.id], correct_reading: true },
      }));
      toaster.create({ description: `Correct!`, type: "success" });
    } else {
      setGrades((prev) => ({
        ...prev,
        [subject.id]: {
          ...prev[subject.id],
          incorrect_reading_answers:
            (prev[subject.id]?.incorrect_reading_answers ?? 0) + 1,
        },
      }));
      toaster.create({
        description: `Incorrect Reading. Total Incorrect Readings: ${(grades[subject.id]?.incorrect_reading_answers ?? 0) + 1}`,
        type: "error",
      });
    }
  }

  // If the meaning and reading are both correct, submit the review and mark the subject as completed
  useEffect(() => {
    setTimeout(() => {
      if (correctMeaning && correctReading && !completedSubjects.includes(subject.id)) {
        mutation.mutate();
        setCompletedSubjects((prev) => [...prev, subject.id]);
      }
    }, 500);
  }, [
    correctMeaning,
    correctReading,
    completedSubjects,
    subject,
    mutation,
    setCompletedSubjects,
  ]);

  return (
    <>
      <Flex direction={{ base: "column", md: "row" }} gap="{2}" justify="space-around">
        <form onSubmit={checkMeaning}>
          <Stack direction={"row"} alignItems={"flex-end"}>
            <Field.Root disabled={correctMeaning}>
              <Field.Label>Meaning</Field.Label>
              <Input
                autoFocus
                value={meaningAnswer}
                onChange={(e) => setMeaningAnswer(e.target.value)}
              />
            </Field.Root>
            <Button type="submit" disabled={correctMeaning}>
              Submit
            </Button>
          </Stack>
        </form>
        <form onSubmit={checkReading}>
          <Stack direction={"row"} alignItems={"flex-end"}>
            <Field.Root
              disabled={
                !subject.data.readings ||
                subject.data.readings.length === 0 ||
                correctReading
              }
            >
              <Field.Label>Reading</Field.Label>
              <Input
                value={readingAnswer}
                onChange={(e) => setReadingAnswer(e.target.value)}
              />
            </Field.Root>
            <Button
              type="submit"
              disabled={
                !subject.data.readings ||
                subject.data.readings.length === 0 ||
                correctReading
              }
            >
              Submit
            </Button>
          </Stack>
        </form>
      </Flex>
      {displayHint()}
      <Toaster />
    </>
  );
}
