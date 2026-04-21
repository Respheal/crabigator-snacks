import { useState } from "react";
import { Button, Text, Stack, Card, Separator, SimpleGrid } from "@chakra-ui/react";
import type { Subject, SubjectGrade } from "./interfaces";
import { SubjectCard } from "./SubjectCard";

export function Flashcards({
  subjects,
  completedSubjects,
  setCompletedSubjects,
}: {
  subjects: Subject[];
  completedSubjects: number[];
  setCompletedSubjects: React.Dispatch<React.SetStateAction<number[]>>;
}) {
  const [displayedSubject, setDisplayedSubject] = useState(subjects[0] ?? null);
  const [grades, setGrades] = useState<SubjectGrade>({});

  // Initialize the grade for the displayed subject
  if (displayedSubject && !grades[displayedSubject.id]) {
    setGrades((prev) => ({
      ...prev,
      [displayedSubject.id]: {
        incorrect_meaning_answers: 0,
        incorrect_reading_answers: 0,
        correct_meaning: false,
        correct_reading:
          !displayedSubject.data.readings || displayedSubject.data.readings.length === 0,
      },
    }));
  }

  if (subjects.length === 0) {
    return (
      <Card.Root>
        <Card.Body>
          <Text textAlign={"center"}>No assignments available</Text>
        </Card.Body>
      </Card.Root>
    );
  }

  function subjectButtons() {
    return subjects.map((subject) => {
      return (
        <Button
          disabled={completedSubjects.includes(subject.id)}
          colorPalette={completedSubjects.includes(subject.id) ? "green" : "gray"}
          key={subject.id}
          variant="outline"
          onClick={() => setDisplayedSubject(subject)}
        >
          {subject.data.characters}
        </Button>
      );
    });
  }

  return (
    <Card.Root>
      <Card.Header>
        <Text textStyle="7xl" textAlign={"center"}>
          {displayedSubject ? displayedSubject.data.characters : ""}
        </Text>
        <Text textStyle="xl" textAlign={"center"}>
          {displayedSubject ? displayedSubject.object : ""}
        </Text>
      </Card.Header>
      <Card.Body>
        <Stack gap={6}>
          <SubjectCard
            subject={displayedSubject}
            completedSubjects={completedSubjects}
            setCompletedSubjects={setCompletedSubjects}
            grades={grades}
            setGrades={setGrades}
            key={displayedSubject.id}
          />
          <Separator />
          <SimpleGrid minChildWidth={12} columnGap={2} rowGap={3}>
            {subjectButtons()}
          </SimpleGrid>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
