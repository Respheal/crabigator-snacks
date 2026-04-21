import { useEffect, useState } from "react";
import { Button, Stack, Input, Field, Center, Flex } from "@chakra-ui/react";
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

  // Initialize the subject grade in state if it doesn't exist
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!grades[subject.id]) {
        setGrades((prev) => ({
          ...prev,
          [subject.id]: {
            incorrect_meaning_answers: 0,
            incorrect_reading_answers: 0,
            correct_meaning: false,
            // Set readings to correct automatically if there are no readings for the subject
            correct_reading: !subject.data.readings || subject.data.readings.length === 0,
          },
        }));
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const incorrectMeaningCount = grades[subject.id]?.incorrect_meaning_answers ?? 0;
  const incorrectReadingCount = grades[subject.id]?.incorrect_reading_answers ?? 0;
  const [correctReading, setCorrectReading] = useState(
    grades[subject.id]?.correct_reading ??
      (!subject.data.readings || subject.data.readings.length === 0),
  );
  const [correctMeaning, setCorrectMeaning] = useState(
    grades[subject.id]?.correct_meaning ?? false,
  );

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
        description: `Incorrect Meaning. Total Incorrect Meanings: ${grades[subject.id]?.incorrect_meaning_answers ?? 0}`,
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
        description: `Incorrect Reading. Total Incorrect Readings: ${grades[subject.id]?.incorrect_reading_answers ?? 0}`,
        type: "error",
      });
    }
  }

  return (
    <>
      <Flex direction={{ base: "column", md: "row" }} gap="{2}" justify="space-around">
        <form onSubmit={checkMeaning}>
          <Stack direction={"row"} alignItems={"flex-end"}>
            <Field.Root disabled={correctMeaning}>
              <Field.Label>Meaning</Field.Label>
              <Input
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
      <Center>
        <Button
          type="submit"
          disabled={
            !correctMeaning || !correctReading || completedSubjects.includes(subject.id)
          }
          onClick={() => {
            mutation.mutate();
            toaster.create({
              title: `Submitting Review for ${subject.data.characters}`,
              description: `Incorrect Meanings: ${incorrectMeaningCount}, Incorrect Readings: ${incorrectReadingCount}`,
              type: "info",
            });
            setCompletedSubjects((prev) => [...prev, subject.id]);
          }}
        >
          Submit Review
        </Button>
      </Center>
      <Toaster />
    </>
  );
}
