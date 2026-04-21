import { useState } from "react";
import {
  Button,
  Text,
  Stack,
  Card,
  Center,
  Separator,
  SimpleGrid,
} from "@chakra-ui/react";
import type { Subject } from "./interfaces";
import { SubjectCard } from "./SubjectCard";

export function Flashcards({ subjects }: { subjects: Subject[] }) {
  const [displayedSubject, setDisplayedSubject] = useState(subjects[0] ?? null);
  const [completedSubjects, setCompletedSubjects] = useState<number[]>([]);
  const [grades, setGrades] = useState<{
    [subjectId: number]: {
      incorrect_meaning_answers: number;
      incorrect_reading_answers: number;
      correct_meaning: boolean;
      correct_reading: boolean;
    };
  }>({});

  if (subjects.length === 0) {
    return (
      <Center h="100vh">
        <Text textStyle="7xl" textAlign={"center"}>
          ???
        </Text>
        <Text textAlign={"center"}>No assignments available</Text>
      </Center>
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
