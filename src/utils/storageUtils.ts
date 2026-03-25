import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/firebase";

/**
 * Interface representing a Problem Statement
 */
export interface ProblemStatement {
  id: string;
  title: string;
  objective: string;
  domain: string;
  max_team_size: number;
  members: number;
  count: number;
}

/**
 * Fetches the problem statements JSON from Firebase Storage.
 * @returns Promise<ProblemStatement[]>
 */
export const fetchProblemStatements = async (): Promise<ProblemStatement[]> => {
  try {
    // 1. Reference the file in Storage
    // IMPORTANT: Path must match your manual upload (e.g., "problems.json")
    const fileRef = ref(storage, "problems.json");

    // 2. Get the public download URL
    const url = await getDownloadURL(fileRef);

    // 3. Fetch the JSON data
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to load problem statements data.");

    const data: ProblemStatement[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching problem statements from storage:", error);
    return [];
  }
};
