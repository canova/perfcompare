import { repoMap, frameworks } from '../../common/constants';
import { fetchSubtestsCompareResults } from '../../logic/treeherder';
import { Repository } from '../../types/state';
import { Framework } from '../../types/types';

// This function checks and sanitizes the input values, then returns values that
// we can then use in the rest of the application.
function checkValues({
  baseRev,
  baseRepo,
  newRev,
  newRepo,
  framework,
  parentSignature,
}: {
  baseRev: string | null;
  baseRepo: Repository['name'] | null;
  newRev: string | null;
  newRepo: Repository['name'] | null;
  framework: string | number | null;
  parentSignature: string | null;
}): {
  baseRev: string;
  baseRepo: Repository['name'];
  newRev: string;
  newRepo: Repository['name'];
  frameworkId: Framework['id'];
  frameworkName: Framework['name'];
  parentSignature: string;
} {
  if (baseRev === null) {
    throw new Error('The parameter baseRev is missing.');
  }

  if (baseRepo === null) {
    throw new Error('The parameter baseRepo is missing.');
  }

  if (newRev === null) {
    throw new Error('The parameter newRev is missing.');
  }

  if (newRepo === null) {
    throw new Error('The parameter newRepo is missing.');
  }

  const validRepoValues = Object.values(repoMap);
  if (!validRepoValues.includes(baseRepo)) {
    throw new Error(
      `The parameter baseRepo "${baseRepo}" should be one of ${validRepoValues.join(
        ', ',
      )}.`,
    );
  }
  if (!validRepoValues.includes(newRepo)) {
    throw new Error(
      `The parameter newRepo "${newRepo}" should be one of ${validRepoValues.join(
        ', ',
      )}.`,
    );
  }

  if (parentSignature === null) {
    throw new Error('The parameter parentSignature is missing.');
  }

  if (framework === null) {
    framework = 1; // default to talos so that manually typing the URL is easier
  }

  const frameworkId = +framework as Framework['id'];
  if (Number.isNaN(frameworkId)) {
    throw new Error(
      `The parameter framework should be a number, but it is "${framework}".`,
    );
  }
  const frameworkName = frameworks.find(
    (entry) => entry.id === frameworkId,
  )?.name;

  if (!frameworkName) {
    throw new Error(
      `The parameter framework isn't a valid value: "${framework}".`,
    );
  }

  return {
    baseRev,
    baseRepo,
    newRev,
    newRepo,
    frameworkId,
    frameworkName,
    parentSignature,
  };
}

// This function is responsible for fetching the data from the URL. It's called
// by React Router DOM when the compare-results path is requested.
// It uses the URL parameters as inputs, and returns all the fetched data to the
// React components through React Router's useLoaderData hook.
export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);

  const baseRevFromUrl = url.searchParams.get('baseRev');
  const baseRepoFromUrl = url.searchParams.get('baseRepo') as
    | Repository['name']
    | null;
  const newRevFromUrl = url.searchParams.get('newRev');
  const newRepoFromUrl = url.searchParams.get('newRepo') as
    | Repository['name']
    | null;
  const frameworkFromUrl = url.searchParams.get('framework');
  const parentSignatureFromUrl = url.searchParams.get('parentSignature');

  const {
    baseRev,
    baseRepo,
    newRev,
    newRepo,
    frameworkId,
    frameworkName,
    parentSignature,
  } = checkValues({
    baseRev: baseRevFromUrl,
    baseRepo: baseRepoFromUrl,
    newRev: newRevFromUrl,
    newRepo: newRepoFromUrl,
    framework: frameworkFromUrl,
    parentSignature: parentSignatureFromUrl,
  });

  const results = fetchSubtestsCompareResults({
    baseRev,
    baseRepo,
    newRev,
    newRepo,
    framework: frameworkId,
    parentSignature,
  });

  return {
    results,
    baseRev,
    baseRepo,
    newRev,
    newRepo,
    frameworkId,
    frameworkName,
    parentSignature,
  };
}

export type LoaderReturnValue = Awaited<ReturnType<typeof loader>>;