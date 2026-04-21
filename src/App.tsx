import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Text,
  Stack,
  Input,
  Icon,
  NumberInput,
  Field,
  Link,
  Code,
  Card,
  List,
  Heading,
  Kbd,
  Center,
  Flex,
} from "@chakra-ui/react";
import { FaGithub } from "react-icons/fa";
import {
  queryOptions,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type { AssignmentCollection, Subject } from "./interfaces";
import { Flashcards } from "./Flashcards";

export function App() {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState(
    queryClient.getQueryData(["apiKey"]) ?? localStorage.getItem("apiKey") ?? "",
  );
  const [batchSize, setBatchSize] = useState("10"); // how many reviews to fetch
  const [debouncedBatch, setDebouncedBatch] = useState(batchSize); // debouncer for batch size
  const [submitted, setSubmitted] = useState(false); // wait for submit button before fetching data
  const { data: assignments, error } = useQuery(assignmentOptions(apiKey));
  const assignmentBatch = assignments?.data.slice(0, Number(debouncedBatch)) ?? [];
  const [completedSubjects, setCompletedSubjects] = useState<number[]>([]);

  // Wait a sec before updating the batch size
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBatch(batchSize);
    }, 500);

    return () => clearTimeout(timer);
  }, [batchSize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      // If the user has completed all subjects in the current batch,
      // we can fetch the next batch
      if (completedSubjects.length == Number(batchSize)) {
        setBatchSize((prev) => String(Number(prev) + Number(prev)));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [completedSubjects, batchSize]);

  // Query functions

  async function getAssignments(apiKey: string): Promise<AssignmentCollection> {
    const date = new Date();
    const response = await fetch(
      `https://api.wanikani.com/v2/assignments?available_before=${date.toISOString()}`,
      {
        headers: {
          "Wanikani-Revision": "20170710",
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );
    return await response.json();
  }

  async function getSubjects(subject_id: number, apiKey: string): Promise<Subject> {
    const response = await fetch(`https://api.wanikani.com/v2/subjects/${subject_id}`, {
      headers: {
        "Wanikani-Revision": "20170710",
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return await response.json();
  }

  function assignmentOptions(apiKey: string) {
    return queryOptions({
      queryKey: ["assignments"],
      queryFn: () => getAssignments(apiKey),
      enabled: !!apiKey && submitted,
    });
  }

  const subjectResults = useQueries({
    queries: assignmentBatch.map((assignment) => ({
      queryKey: ["subject", assignment.data.subject_id],
      queryFn: () => getSubjects(assignment.data.subject_id, apiKey),
      enabled: !!apiKey && !!assignmentBatch,
    })),
  });
  const isBatchLoading = subjectResults.some((res) => res.isLoading);
  const flashcards = subjectResults.map((res) => res.data).filter(Boolean);

  // API key submission form
  const submitAPIKey = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevents page reload
    setApiKey(apiKey); // Update the state with the new API key
    setSubmitted(true); // Mark the API key as submitted
    localStorage.setItem("apiKey", apiKey);
    queryClient.setQueryData(["apiKey"], apiKey);
  };

  // Rendering logic

  if (error) {
    return <Text>Error fetching assignments: {error.message}</Text>;
  }

  function renderFlashcards() {
    if (isBatchLoading) {
      return <Text>Loading subjects...</Text>;
    }
    if (submitted && flashcards.length === 0) {
      return <Text>No subjects to display.</Text>;
    }
    if (flashcards.some((subject) => !subject)) {
      return <Text>Error loading some subjects.</Text>;
    }
    if (flashcards.length > 0) {
      return (
        <Flashcards
          key={flashcards.length}
          subjects={flashcards as Subject[]}
          completedSubjects={completedSubjects}
          setCompletedSubjects={setCompletedSubjects}
        />
      );
    }
  }

  return (
    <Flex justifyContent={"center"}>
      <Stack minW={"sm"} padding={4}>
        <Box>
          <form onSubmit={submitAPIKey}>
            <Stack direction={{ base: "column", md: "row" }} gap="{2}" align="flex-start">
              <Field.Root>
                <Field.Label>
                  WaniKani API Key
                  <Field.RequiredIndicator />
                </Field.Label>
                <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
                <Field.HelperText>
                  API Key requires the <Code>reviews:create</Code> scope. You can create a
                  new API key{" "}
                  <Link
                    variant="underline"
                    href="https://www.wanikani.com/settings/personal_access_tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    here
                  </Link>
                  .
                </Field.HelperText>
              </Field.Root>
              <Stack direction="row" align={"flex-end"} width={{ base: "full", md: 80 }}>
                <Field.Root>
                  <Field.Label>
                    Batch Size
                    <Field.RequiredIndicator />
                  </Field.Label>
                  <NumberInput.Root
                    width={"full"}
                    value={batchSize}
                    onValueChange={(details) => setBatchSize(details.value)}
                  >
                    <NumberInput.Control />
                    <NumberInput.Input />
                  </NumberInput.Root>
                </Field.Root>
                <Button type="submit">Submit</Button>
              </Stack>
            </Stack>
          </form>
        </Box>
        {renderFlashcards()}
        <Card.Root>
          <Card.Body>
            <Heading>Installing language packs:</Heading>
            <Box padding={2}>
              <List.Root>
                <List.Item>
                  <Link
                    variant="underline"
                    href="https://support.microsoft.com/en-us/windows/language-packs-for-windows-a5094319-a92d-18de-5b53-1cfc697cfca8#windowsversion=windows_11"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Language packs for Windows
                  </Link>
                  <List.Root ps="5">
                    <List.Item>
                      To shift languages, <Kbd>Shift</Kbd>+<Kbd>Alt</Kbd> to switch to the
                      Japanese keyboard, then <Kbd>Shift</Kbd>+<Kbd>Caps</Kbd> to switch
                      to Hiragana.
                    </List.Item>
                  </List.Root>
                </List.Item>
                <List.Item>
                  <Link
                    variant="underline"
                    href="https://support.google.com/android/answer/12395118?hl=en"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Change app language on your Android phone
                  </Link>
                </List.Item>
              </List.Root>
            </Box>
          </Card.Body>
        </Card.Root>
        <Box padding={2}>
          <Center>
            <Link
              href="https://github.com/Respheal/crabigator-snacks"
              title="View on Github"
            >
              <Icon size="lg">
                <FaGithub />
              </Icon>
            </Link>
          </Center>
        </Box>
      </Stack>
    </Flex>
  );
}
