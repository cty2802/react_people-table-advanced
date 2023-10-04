import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { PeopleFilters } from '../components/PeopleFilters';
import { Loader } from '../components/Loader';
import { PeopleTable } from '../components/PeopleTable';
import { Person } from '../types/Person';
import { getPeople } from '../services/people';
import { getPeopleWithParents } from '../helper';
import { Gender } from '../types/Gender';

function hasNormalizedQuery(content: string, query: string | null): boolean {
  const normalizedQuery = query?.trim()?.toLowerCase() ?? '';

  return content.toLowerCase().includes(normalizedQuery);
}

function filterByGender(person: Person, selectedGender: Gender): boolean {
  return selectedGender === Gender.All || selectedGender === person.sex;
}

function filterByCentury(person: Person, centuries: string[]):boolean {
  return !centuries?.length
    ? true
    : centuries.includes(Math.floor(person.born / 100).toString());
}

function filterPeopleByQuery(
  people: Person[],
  query: string | null,
  selectedGender: Gender,
  centuries: string[],
) {
  if (!query && !selectedGender && !centuries) {
    return people;
  }

  return people.filter((person): boolean => (
    (hasNormalizedQuery(person.name, query)
    || hasNormalizedQuery(person.fatherName ?? '', query)
    || hasNormalizedQuery(person.motherName ?? '', query))
    && filterByGender(person, selectedGender)
    && filterByCentury(person, centuries)
  ));
}

export const PeoplePage: React.FC = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMassage, setErrorMassage] = useState('');

  const [searchParams] = useSearchParams();
  const { slug: selectedSlug } = useParams();

  const isShowTable = !isLoading && !!people.length;

  const isPeople = !isLoading
    && !errorMassage
    && !people.length;

  useEffect(() => {
    setIsLoading(true);

    getPeople()
      .then(peopleList => {
        setPeople(getPeopleWithParents(peopleList));
      })
      .catch(() => setErrorMassage('Something went wrong'))
      .finally(() => setIsLoading(false));
  }, []);

  const selectedGender: string = searchParams.get('sex') ?? '';
  const query = searchParams.get('query') ?? null;
  const centuries = searchParams.getAll('centuries') || [];

  const genderEnum = Object.values(Gender).find(g => g === selectedGender)
    ?? Gender.All;

  const visiblePeople = filterPeopleByQuery(
    people,
    query,
    genderEnum,
    centuries,
  );

  return (
    <>
      <h1 className="title">People Page</h1>

      <div className="block">
        <div className="columns is-desktop is-flex-direction-row-reverse">
          <div className="column is-7-tablet is-narrow-desktop">
            <PeopleFilters
              query={query}
              centuries={centuries}
            />
          </div>

          <div className="column">
            <div className="box table-container">
              {isLoading && (
                <Loader />
              )}

              {isShowTable && (
                <PeopleTable
                  people={visiblePeople}
                  selectedSlug={selectedSlug}
                />
              )}

              {isPeople
                && (
                  <p data-cy="noPeopleMessage">
                    There are no people on the server
                  </p>
                )}

              <p>There are no people matching the current search criteria</p>

              {errorMassage && (
                <p
                  data-cy="peopleLoadingError"
                  className="has-text-danger"
                >
                  {errorMassage}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
