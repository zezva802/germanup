import React from 'react';

function Intro({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 mb-6">
      <p className="text-brand-800 text-sm leading-relaxed">{children}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="font-semibold text-gray-900 mb-3 text-base">{title}</h3>
      {children}
    </section>
  );
}

function Examples({ items }: { items: { de: string; en: string }[] }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 my-3">
      <div className="space-y-2">
        {items.map((ex, i) => (
          <div key={i}>
            <span className="font-medium text-gray-900">{ex.de}</span>
            <span className="text-gray-500 ml-2 text-sm">— {ex.en}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GrammarTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50">
            {headers.map((h, i) => (
              <th key={i} className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {row.map((cell, j) => (
                <td key={j} className="border border-gray-200 px-3 py-2 text-gray-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
      <p className="text-yellow-800 text-sm">
        <strong>Tip:</strong> {children}
      </p>
    </div>
  );
}

function Rule({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 my-3">
      <p className="text-blue-800 text-sm font-medium">{children}</p>
    </div>
  );
}

// ─── TOPIC COMPONENTS ────────────────────────────────────────────────────────

function Praesens() {
  return (
    <>
      <Intro>
        The Präsens (present tense) is the most important tense in German. Use it to describe
        what is happening now, habitual actions, and general truths. German present tense
        often covers what English expresses as both "I play" and "I am playing."
      </Intro>

      <Section title="Regular Verb Endings">
        <p className="text-gray-600 text-sm mb-2">
          Remove the infinitive ending <strong>-en</strong> to get the verb stem, then add
          these endings:
        </p>
        <GrammarTable
          headers={['Pronoun', 'Ending', 'machen (to do)', 'spielen (to play)']}
          rows={[
            ['ich', '-e', 'mache', 'spiele'],
            ['du', '-st', 'machst', 'spielst'],
            ['er / sie / es', '-t', 'macht', 'spielt'],
            ['wir', '-en', 'machen', 'spielen'],
            ['ihr', '-t', 'macht', 'spielt'],
            ['sie / Sie', '-en', 'machen', 'spielen'],
          ]}
        />
        <Examples
          items={[
            { de: 'Ich spiele Fußball.', en: 'I play football.' },
            { de: 'Du machst Hausaufgaben.', en: 'You do homework.' },
            { de: 'Wir lernen Deutsch.', en: 'We are learning German.' },
          ]}
        />
      </Section>

      <Section title="Stem-Vowel Changes (Strong Verbs)">
        <p className="text-gray-600 text-sm mb-2">
          Some common verbs change their stem vowel in the <strong>du</strong> and{' '}
          <strong>er/sie/es</strong> forms:
        </p>
        <GrammarTable
          headers={['Infinitive', 'du form', 'er/sie/es form', 'Change']}
          rows={[
            ['fahren (to drive)', 'fährst', 'fährt', 'a → ä'],
            ['schlafen (to sleep)', 'schläfst', 'schläft', 'a → ä'],
            ['lesen (to read)', 'liest', 'liest', 'e → ie'],
            ['sehen (to see)', 'siehst', 'sieht', 'e → ie'],
            ['sprechen (to speak)', 'sprichst', 'spricht', 'e → i'],
            ['essen (to eat)', 'isst', 'isst', 'e → i'],
            ['nehmen (to take)', 'nimmst', 'nimmt', 'e → i'],
          ]}
        />
        <Tip>Only the du and er/sie/es forms change — ich, wir, ihr, sie stay regular.</Tip>
      </Section>

      <Section title="sein and haben (Irregular)">
        <GrammarTable
          headers={['Pronoun', 'sein (to be)', 'haben (to have)']}
          rows={[
            ['ich', 'bin', 'habe'],
            ['du', 'bist', 'hast'],
            ['er / sie / es', 'ist', 'hat'],
            ['wir', 'sind', 'haben'],
            ['ihr', 'seid', 'habt'],
            ['sie / Sie', 'sind', 'haben'],
          ]}
        />
        <Examples
          items={[
            { de: 'Ich bin müde.', en: 'I am tired.' },
            { de: 'Er hat einen Hund.', en: 'He has a dog.' },
            { de: 'Wir sind in Berlin.', en: 'We are in Berlin.' },
          ]}
        />
      </Section>
    </>
  );
}

function NounGender() {
  return (
    <>
      <Intro>
        Every German noun has a grammatical gender: masculine (der), feminine (die), or neuter
        (das). Gender must be memorised with each noun — but there are helpful patterns!
      </Intro>

      <Section title="The Three Articles">
        <GrammarTable
          headers={['Gender', 'Article', 'Examples']}
          rows={[
            ['Masculine', 'der', 'der Mann, der Hund, der Tisch'],
            ['Feminine', 'die', 'die Frau, die Katze, die Schule'],
            ['Neuter', 'das', 'das Kind, das Buch, das Auto'],
            ['Plural (all)', 'die', 'die Männer, die Frauen, die Kinder'],
          ]}
        />
        <Examples
          items={[
            { de: 'Der Hund ist groß.', en: 'The dog is big.' },
            { de: 'Die Katze schläft.', en: 'The cat is sleeping.' },
            { de: 'Das Kind spielt.', en: 'The child is playing.' },
          ]}
        />
      </Section>

      <Section title="Gender Clues from Endings">
        <GrammarTable
          headers={['Ending', 'Gender', 'Examples']}
          rows={[
            ['-ung', 'die (f)', 'die Wohnung, die Übung, die Zeitung'],
            ['-keit / -heit', 'die (f)', 'die Freiheit, die Möglichkeit'],
            ['-schaft', 'die (f)', 'die Freundschaft, die Mannschaft'],
            ['-tion', 'die (f)', 'die Station, die Nation'],
            ['-er (agent)', 'der (m)', 'der Lehrer, der Bäcker, der Fahrer'],
            ['-ling', 'der (m)', 'der Frühling, der Lehrling'],
            ['-chen / -lein', 'das (n)', 'das Mädchen, das Brötchen'],
            ['-ment', 'das (n)', 'das Instrument, das Dokument'],
          ]}
        />
        <Tip>
          Diminutives ending in -chen or -lein are ALWAYS das, even for feminine nouns: die Frau →
          das Frauchen.
        </Tip>
      </Section>

      <Section title="Indefinite Articles (a / an)">
        <GrammarTable
          headers={['Gender', 'Indefinite', 'Negative']}
          rows={[
            ['Masculine', 'ein Mann', 'kein Mann'],
            ['Feminine', 'eine Frau', 'keine Frau'],
            ['Neuter', 'ein Kind', 'kein Kind'],
          ]}
        />
        <Rule>Always learn new nouns with their article: not "Hund" but "der Hund".</Rule>
      </Section>
    </>
  );
}

function Cases() {
  return (
    <>
      <Intro>
        German has four grammatical cases. At A1, you need Nominative, Accusative, and Dative.
        Cases show the role a noun plays in a sentence — who does the action, who receives it.
      </Intro>

      <Section title="Nominative — The Subject">
        <p className="text-gray-600 text-sm mb-2">
          The nominative is used for the subject: the person or thing performing the action.
        </p>
        <Examples
          items={[
            { de: 'Der Hund bellt.', en: 'The dog barks. (dog = subject)' },
            { de: 'Eine Frau liest.', en: 'A woman reads. (woman = subject)' },
          ]}
        />
      </Section>

      <Section title="Accusative — The Direct Object">
        <p className="text-gray-600 text-sm mb-2">
          The accusative is the direct object: who or what receives the action directly.
          Only the <strong>masculine</strong> article changes (der → den, ein → einen).
        </p>
        <GrammarTable
          headers={['Gender', 'Nom.', 'Akk.', 'Example (Akk.)']}
          rows={[
            ['Masculine', 'der / ein', 'den / einen', 'Ich sehe den Mann.'],
            ['Feminine', 'die / eine', 'die / eine', 'Ich sehe die Frau.'],
            ['Neuter', 'das / ein', 'das / ein', 'Ich sehe das Kind.'],
            ['Plural', 'die', 'die', 'Ich sehe die Kinder.'],
          ]}
        />
        <Examples
          items={[
            { de: 'Ich kaufe einen Kaffee.', en: 'I buy a coffee.' },
            { de: 'Sie liebt den Hund.', en: 'She loves the dog.' },
            { de: 'Er liest das Buch.', en: 'He reads the book.' },
          ]}
        />
      </Section>

      <Section title="Dative — The Indirect Object">
        <p className="text-gray-600 text-sm mb-2">
          The dative is the indirect object: to or for whom something is done.
        </p>
        <GrammarTable
          headers={['Gender', 'Nom.', 'Dativ', 'Example (Dat.)']}
          rows={[
            ['Masculine', 'der / ein', 'dem / einem', 'Ich gebe dem Mann das Buch.'],
            ['Feminine', 'die / eine', 'der / einer', 'Ich helfe der Frau.'],
            ['Neuter', 'das / ein', 'dem / einem', 'Ich gebe dem Kind Milch.'],
            ['Plural', 'die', 'den (+n)', 'Ich helfe den Kindern.'],
          ]}
        />
        <Examples
          items={[
            { de: 'Ich gebe der Frau einen Blume.', en: 'I give the woman a flower.' },
            { de: 'Er hilft dem Kind.', en: 'He helps the child.' },
            { de: 'Sie schreibt einem Freund.', en: 'She writes to a friend.' },
          ]}
        />
        <Tip>
          Dative plural adds -n to the noun: die Kinder → den Kindern, die Hunde → den Hunden.
        </Tip>
      </Section>
    </>
  );
}

function PersonalPronouns() {
  return (
    <>
      <Intro>
        Personal pronouns replace nouns and change form depending on grammatical case.
        German has formal (Sie) and informal (du/ihr) ways to address people.
      </Intro>

      <Section title="Nominative Pronouns">
        <GrammarTable
          headers={['Person', 'German', 'English']}
          rows={[
            ['1st singular', 'ich', 'I'],
            ['2nd singular (informal)', 'du', 'you'],
            ['3rd singular m/f/n', 'er / sie / es', 'he / she / it'],
            ['1st plural', 'wir', 'we'],
            ['2nd plural (informal)', 'ihr', 'you (plural)'],
            ['3rd plural / formal', 'sie / Sie', 'they / You (formal)'],
          ]}
        />
        <Tip>Sie (formal, capital S) is used for polite address to strangers and in formal situations.</Tip>
      </Section>

      <Section title="Accusative Pronouns">
        <GrammarTable
          headers={['Nominative', 'Accusative', 'Example']}
          rows={[
            ['ich', 'mich', 'Er sieht mich. — He sees me.'],
            ['du', 'dich', 'Ich mag dich. — I like you.'],
            ['er', 'ihn', 'Wir kennen ihn. — We know him.'],
            ['sie (she)', 'sie', 'Ich rufe sie an. — I call her.'],
            ['es', 'es', 'Ich esse es. — I eat it.'],
            ['wir', 'uns', 'Sie hilft uns. — She helps us.'],
            ['ihr', 'euch', 'Er sieht euch. — He sees you all.'],
            ['sie/Sie', 'sie/Sie', 'Wir kennen sie. — We know them.'],
          ]}
        />
      </Section>

      <Section title="Dative Pronouns">
        <GrammarTable
          headers={['Nominative', 'Dative', 'Example']}
          rows={[
            ['ich', 'mir', 'Er gibt mir das Buch.'],
            ['du', 'dir', 'Ich helfe dir.'],
            ['er', 'ihm', 'Sie hilft ihm.'],
            ['sie (she)', 'ihr', 'Wir schreiben ihr.'],
            ['es', 'ihm', 'Ich gebe ihm Wasser.'],
            ['wir', 'uns', 'Er erklärt uns die Regel.'],
            ['ihr', 'euch', 'Sie gibt euch Hausaufgaben.'],
            ['sie/Sie', 'ihnen/Ihnen', 'Ich danke ihnen.'],
          ]}
        />
        <Examples
          items={[
            { de: 'Kannst du mir helfen?', en: 'Can you help me?' },
            { de: 'Ich gebe dir meine Nummer.', en: 'I give you my number.' },
          ]}
        />
      </Section>
    </>
  );
}

function PossessivePronouns() {
  return (
    <>
      <Intro>
        Possessive pronouns (mein, dein, sein…) show ownership. They take the same endings
        as the indefinite article (ein/eine/ein) and decline for case.
      </Intro>

      <Section title="Possessive Pronouns Overview">
        <GrammarTable
          headers={['Person', 'Possessive', 'Meaning']}
          rows={[
            ['ich', 'mein-', 'my'],
            ['du', 'dein-', 'your (informal sg.)'],
            ['er / es', 'sein-', 'his / its'],
            ['sie (she)', 'ihr-', 'her'],
            ['wir', 'unser-', 'our'],
            ['ihr', 'euer- (eur-)', 'your (informal pl.)'],
            ['sie / Sie', 'ihr- / Ihr-', 'their / your (formal)'],
          ]}
        />
      </Section>

      <Section title="Case Endings (like ein-)">
        <GrammarTable
          headers={['Case', 'Masculine', 'Feminine', 'Neuter', 'Plural']}
          rows={[
            ['Nominative', 'mein', 'meine', 'mein', 'meine'],
            ['Accusative', 'meinen', 'meine', 'mein', 'meine'],
            ['Dative', 'meinem', 'meiner', 'meinem', 'meinen'],
          ]}
        />
        <Examples
          items={[
            { de: 'Das ist mein Hund.', en: 'That is my dog.' },
            { de: 'Ich liebe meine Mutter.', en: 'I love my mother.' },
            { de: 'Er spielt mit seinem Freund.', en: 'He plays with his friend.' },
            { de: 'Wo ist dein Auto?', en: 'Where is your car?' },
          ]}
        />
        <Tip>
          euer loses the second e when an ending is added: euer → eure (nom. f/pl), eurem (dat. m/n).
        </Tip>
      </Section>
    </>
  );
}

function ModalVerbs() {
  return (
    <>
      <Intro>
        Modal verbs express ability, necessity, permission, or desire. They are used with
        an infinitive at the end of the sentence. All modals have irregular ich/er forms.
      </Intro>

      <Section title="The Six Modal Verbs">
        <GrammarTable
          headers={['Infinitive', 'Meaning', 'ich / er form']}
          rows={[
            ['können', 'can, to be able to', 'kann'],
            ['müssen', 'must, to have to', 'muss'],
            ['wollen', 'to want to', 'will'],
            ['sollen', 'should, to be supposed to', 'soll'],
            ['dürfen', 'may, to be allowed to', 'darf'],
            ['mögen / möchten', 'to like / would like to', 'mag / möchte'],
          ]}
        />
      </Section>

      <Section title="Full Conjugation of können">
        <GrammarTable
          headers={['Pronoun', 'können', 'müssen', 'wollen']}
          rows={[
            ['ich', 'kann', 'muss', 'will'],
            ['du', 'kannst', 'musst', 'willst'],
            ['er / sie / es', 'kann', 'muss', 'will'],
            ['wir', 'können', 'müssen', 'wollen'],
            ['ihr', 'könnt', 'müsst', 'wollt'],
            ['sie / Sie', 'können', 'müssen', 'wollen'],
          ]}
        />
      </Section>

      <Section title="Sentence Structure">
        <Rule>Modal verb in position 2 · Infinitive at the END of the sentence.</Rule>
        <Examples
          items={[
            { de: 'Ich kann gut Deutsch sprechen.', en: 'I can speak German well.' },
            { de: 'Du musst die Hausaufgaben machen.', en: 'You must do the homework.' },
            { de: 'Sie möchte einen Kaffee trinken.', en: 'She would like to drink a coffee.' },
            { de: 'Wir wollen nach Berlin fahren.', en: 'We want to travel to Berlin.' },
            { de: 'Darf ich das Fenster öffnen?', en: 'May I open the window?' },
          ]}
        />
        <Tip>
          In questions and with negation, the structure stays the same — modal stays in
          position 2, infinitive stays at the end.
        </Tip>
      </Section>
    </>
  );
}

function DativPrepositions() {
  return (
    <>
      <Intro>
        Dative prepositions ALWAYS trigger the dative case for the following noun or pronoun.
        Learning this group as a set phrase makes them automatic.
      </Intro>

      <Section title="The Dative Prepositions">
        <Rule>aus · bei · mit · nach · seit · von · zu · gegenüber</Rule>
        <GrammarTable
          headers={['Preposition', 'Meaning', 'Example']}
          rows={[
            ['aus', 'out of, from (origin)', 'Ich komme aus Deutschland.'],
            ['bei', 'at, near, with (at someone\'s place)', 'Ich bin bei meiner Mutter.'],
            ['mit', 'with, by (transport)', 'Ich fahre mit dem Bus.'],
            ['nach', 'after, to (cities/countries w/o article)', 'Wir fahren nach Berlin.'],
            ['seit', 'since, for (ongoing time)', 'Ich wohne seit einem Jahr hier.'],
            ['von', 'from, of, by', 'Das ist ein Buch von meiner Lehrerin.'],
            ['zu', 'to (people/places)', 'Ich gehe zu meinem Freund.'],
            ['gegenüber', 'opposite, across from', 'Die Bank ist gegenüber dem Bahnhof.'],
          ]}
        />
      </Section>

      <Section title="Common Contractions">
        <GrammarTable
          headers={['Preposition + Article', 'Contraction']}
          rows={[
            ['bei + dem', 'beim'],
            ['von + dem', 'vom'],
            ['zu + dem', 'zum'],
            ['zu + der', 'zur'],
          ]}
        />
        <Examples
          items={[
            { de: 'Ich gehe zum Supermarkt.', en: 'I go to the supermarket.' },
            { de: 'Er kommt vom Bahnhof.', en: 'He comes from the train station.' },
            { de: 'Wir sind beim Arzt.', en: 'We are at the doctor\'s.' },
          ]}
        />
      </Section>
    </>
  );
}

function AkkusativPrepositions() {
  return (
    <>
      <Intro>
        Accusative prepositions ALWAYS take the accusative case. A helpful memory trick:
        DUFGOB — Durch, Um, Für, Gegen, Ohne, Bis.
      </Intro>

      <Section title="The Accusative Prepositions">
        <Rule>durch · für · gegen · ohne · um · bis · entlang</Rule>
        <GrammarTable
          headers={['Preposition', 'Meaning', 'Example']}
          rows={[
            ['durch', 'through, across', 'Wir fahren durch den Tunnel.'],
            ['für', 'for', 'Das ist ein Geschenk für meinen Vater.'],
            ['gegen', 'against, around (time)', 'Er fährt gegen einen Baum. / Gegen 8 Uhr.'],
            ['ohne', 'without', 'Ich trinke Kaffee ohne Milch.'],
            ['um', 'around, at (time)', 'Wir gehen um den See. / Um 9 Uhr.'],
            ['bis', 'until, to (destination)', 'Bis nächsten Montag! / Bis zum Bahnhof.'],
            ['entlang', 'along (follows noun)', 'den Fluss entlang'],
          ]}
        />
      </Section>

      <Section title="Examples in Context">
        <Examples
          items={[
            { de: 'Ich kaufe das für dich.', en: 'I buy this for you.' },
            { de: 'Wir laufen durch den Park.', en: 'We walk through the park.' },
            { de: 'Ohne einen Regenschirm gehe ich nicht raus.', en: 'I don\'t go out without an umbrella.' },
            { de: 'Das Café ist um die Ecke.', en: 'The café is around the corner.' },
          ]}
        />
        <Tip>
          entlang usually follows the noun in accusative: den Fluss entlang (along the river).
        </Tip>
      </Section>
    </>
  );
}

function TwoWayPrepositions() {
  return (
    <>
      <Intro>
        Two-way prepositions take either dative (location — WHERE?) or accusative (direction/movement — WHERE TO?).
        This is one of the trickiest but most important rules in German.
      </Intro>

      <Section title="The Nine Two-Way Prepositions">
        <Rule>an · auf · hinter · in · neben · über · unter · vor · zwischen</Rule>
      </Section>

      <Section title="The Key Rule">
        <GrammarTable
          headers={['Question', 'Case', 'Meaning', 'Example']}
          rows={[
            ['Wo? (Where?)', 'Dative', 'Location / State', 'Das Buch liegt auf dem Tisch.'],
            ['Wohin? (Where to?)', 'Accusative', 'Movement / Direction', 'Ich lege das Buch auf den Tisch.'],
          ]}
        />
        <Examples
          items={[
            { de: 'Der Hund liegt vor dem Haus. (Dat.)', en: 'The dog is lying in front of the house.' },
            { de: 'Der Hund läuft vor das Haus. (Akk.)', en: 'The dog runs in front of the house.' },
            { de: 'Die Katze ist in der Küche. (Dat.)', en: 'The cat is in the kitchen.' },
            { de: 'Die Katze geht in die Küche. (Akk.)', en: 'The cat goes into the kitchen.' },
          ]}
        />
      </Section>

      <Section title="Common Contractions">
        <GrammarTable
          headers={['Prep + Article', 'Contraction']}
          rows={[
            ['an + dem', 'am'],
            ['an + das', 'ans'],
            ['in + dem', 'im'],
            ['in + das', 'ins'],
            ['auf + das', 'aufs'],
          ]}
        />
        <Tip>
          Stehen/liegen/hängen/sein → dative (location). Stellen/legen/hängen/gehen → accusative (placement/movement).
        </Tip>
      </Section>
    </>
  );
}

function Imperative() {
  return (
    <>
      <Intro>
        The imperative is used to give commands, instructions, and requests. German has three
        imperative forms depending on who you are addressing.
      </Intro>

      <Section title="Forming the Imperative">
        <GrammarTable
          headers={['Form', 'Rule', 'kommen', 'essen', 'sein']}
          rows={[
            ['du (sg. informal)', 'verb stem (no -st, no pronoun)', 'Komm!', 'Iss!', 'Sei!'],
            ['ihr (pl. informal)', 'ihr-form without ihr', 'Kommt!', 'Esst!', 'Seid!'],
            ['Sie (formal)', 'infinitive + Sie (inverted)', 'Kommen Sie!', 'Essen Sie!', 'Seien Sie!'],
          ]}
        />
        <Examples
          items={[
            { de: 'Komm her!', en: 'Come here! (to a friend)' },
            { de: 'Kommt bitte herein!', en: 'Please come in! (to a group)' },
            { de: 'Kommen Sie bitte herein!', en: 'Please come in! (formal)' },
            { de: 'Iss dein Gemüse!', en: 'Eat your vegetables!' },
            { de: 'Sei ruhig!', en: 'Be quiet!' },
          ]}
        />
      </Section>

      <Section title="Stem-Changing Verbs">
        <p className="text-gray-600 text-sm mb-2">
          Verbs with e→i(e) change keep this in the du-imperative:
        </p>
        <Examples
          items={[
            { de: 'Gib mir das Buch! (geben)', en: 'Give me the book!' },
            { de: 'Lies das Kapitel! (lesen)', en: 'Read the chapter!' },
            { de: 'Sprich langsamer! (sprechen)', en: 'Speak more slowly!' },
          ]}
        />
        <Tip>
          Verbs with a→ä do NOT keep the umlaut in the imperative: fahr! (not fähr!).
        </Tip>
      </Section>

      <Section title="Bitte (Please)">
        <Examples
          items={[
            { de: 'Öffne bitte das Fenster.', en: 'Please open the window.' },
            { de: 'Bitte hilf mir!', en: 'Please help me!' },
          ]}
        />
      </Section>
    </>
  );
}

function SeparableVerbs() {
  return (
    <>
      <Intro>
        Separable verbs (trennbare Verben) have a prefix that splits off and moves to the end
        of the sentence. The prefix changes or modifies the meaning of the base verb.
      </Intro>

      <Section title="How They Work">
        <Rule>
          In a main clause: conjugated verb (position 2) + ... + prefix (end of sentence).
        </Rule>
        <Examples
          items={[
            { de: 'Ich rufe dich an.', en: 'I call you. (anrufen → rufe … an)' },
            { de: 'Er macht die Tür auf.', en: 'He opens the door. (aufmachen → macht … auf)' },
            { de: 'Wir steigen um 9 Uhr ein.', en: 'We board at 9 o\'clock. (einsteigen)' },
            { de: 'Sie kommt um 8 Uhr an.', en: 'She arrives at 8. (ankommen)' },
          ]}
        />
      </Section>

      <Section title="Common Separable Verbs">
        <GrammarTable
          headers={['Verb', 'Prefix', 'Meaning', 'Example']}
          rows={[
            ['anrufen', 'an-', 'to call (phone)', 'Ich rufe dich an.'],
            ['aufmachen', 'auf-', 'to open', 'Mach die Tür auf!'],
            ['aufräumen', 'auf-', 'to tidy up', 'Ich räume mein Zimmer auf.'],
            ['einsteigen', 'ein-', 'to board / get in', 'Steigen Sie bitte ein!'],
            ['aussteigen', 'aus-', 'to get off / out', 'Ich steige an der Haltestelle aus.'],
            ['ankommen', 'an-', 'to arrive', 'Wann kommst du an?'],
            ['mitkommen', 'mit-', 'to come along', 'Kommst du mit?'],
            ['abfahren', 'ab-', 'to depart', 'Der Zug fährt um 10 ab.'],
            ['fernsehen', 'fern-', 'to watch TV', 'Er sieht abends fern.'],
          ]}
        />
      </Section>

      <Section title="With Modal Verbs">
        <p className="text-gray-600 text-sm mb-2">
          With a modal verb, the separable verb stays together as an infinitive at the end:
        </p>
        <Examples
          items={[
            { de: 'Ich muss um 7 aufstehen.', en: 'I have to get up at 7. (aufstehen stays together)' },
            { de: 'Kannst du mich anrufen?', en: 'Can you call me?' },
          ]}
        />
      </Section>
    </>
  );
}

function FutureWerden() {
  return (
    <>
      <Intro>
        German often uses the present tense for future actions (especially with a time word).
        The formal future tense uses werden + infinitive, and is common for predictions,
        intentions, and promises.
      </Intro>

      <Section title="Conjugation of werden">
        <GrammarTable
          headers={['Pronoun', 'werden']}
          rows={[
            ['ich', 'werde'],
            ['du', 'wirst'],
            ['er / sie / es', 'wird'],
            ['wir', 'werden'],
            ['ihr', 'werdet'],
            ['sie / Sie', 'werden'],
          ]}
        />
      </Section>

      <Section title="Structure">
        <Rule>werden (position 2) + … + infinitive (end of sentence)</Rule>
        <Examples
          items={[
            { de: 'Ich werde morgen anrufen.', en: 'I will call tomorrow.' },
            { de: 'Es wird regnen.', en: 'It will rain.' },
            { de: 'Wir werden das Projekt abgeben.', en: 'We will hand in the project.' },
            { de: 'Du wirst das schaffen!', en: 'You will manage it! (encouragement)' },
          ]}
        />
      </Section>

      <Section title="Present Tense for Future (very common)">
        <p className="text-gray-600 text-sm mb-2">
          When a time expression is present, Germans often use Präsens instead of werden:
        </p>
        <Examples
          items={[
            { de: 'Ich fahre morgen nach München.', en: 'I\'m going to Munich tomorrow.' },
            { de: 'Am Wochenende besuche ich meine Eltern.', en: 'I\'m visiting my parents this weekend.' },
          ]}
        />
        <Tip>
          Use werden for emphasis, predictions, or when no time word is present.
          Use present tense for planned/scheduled future events.
        </Tip>
      </Section>
    </>
  );
}

function NumbersTime() {
  return (
    <>
      <Intro>
        Numbers, dates, and time expressions are essential for everyday German.
        German uses a 24-hour clock in formal contexts and a 12-hour clock informally.
      </Intro>

      <Section title="Numbers 1–20">
        <GrammarTable
          headers={['Number', 'German', 'Number', 'German']}
          rows={[
            ['1', 'eins', '11', 'elf'],
            ['2', 'zwei', '12', 'zwölf'],
            ['3', 'drei', '13', 'dreizehn'],
            ['4', 'vier', '14', 'vierzehn'],
            ['5', 'fünf', '15', 'fünfzehn'],
            ['6', 'sechs', '16', 'sechzehn'],
            ['7', 'sieben', '17', 'siebzehn'],
            ['8', 'acht', '18', 'achtzehn'],
            ['9', 'neun', '19', 'neunzehn'],
            ['10', 'zehn', '20', 'zwanzig'],
          ]}
        />
      </Section>

      <Section title="Tens and Compounds">
        <GrammarTable
          headers={['Number', 'German']}
          rows={[
            ['30', 'dreißig'],
            ['40', 'vierzig'],
            ['50', 'fünfzig'],
            ['100', 'hundert'],
            ['21', 'einundzwanzig'],
            ['35', 'fünfunddreißig'],
            ['99', 'neunundneunzig'],
          ]}
        />
        <Tip>21–99: ones + "und" + tens. So 45 = fünfundvierzig (five-and-forty).</Tip>
      </Section>

      <Section title="Telling the Time">
        <GrammarTable
          headers={['Expression', 'German', 'Meaning']}
          rows={[
            ['3:00', 'Es ist drei Uhr.', 'It is 3 o\'clock.'],
            ['3:15', 'Es ist Viertel nach drei.', 'Quarter past three.'],
            ['3:30', 'Es ist halb vier.', 'Half four (3:30).'],
            ['3:45', 'Es ist Viertel vor vier.', 'Quarter to four.'],
            ['at 8', 'um acht Uhr', 'at eight o\'clock'],
          ]}
        />
        <Rule>halb vier means "half of four" = 3:30, NOT 4:30!</Rule>
      </Section>

      <Section title="Days and Months">
        <GrammarTable
          headers={['Day', 'German', 'Month', 'German']}
          rows={[
            ['Monday', 'Montag', 'January', 'Januar'],
            ['Tuesday', 'Dienstag', 'February', 'Februar'],
            ['Wednesday', 'Mittwoch', 'March', 'März'],
            ['Thursday', 'Donnerstag', 'April', 'April'],
            ['Friday', 'Freitag', 'May', 'Mai'],
            ['Saturday', 'Samstag', 'June', 'Juni'],
            ['Sunday', 'Sonntag', 'July', 'Juli'],
          ]}
        />
        <Examples
          items={[
            { de: 'Heute ist Montag, der 5. März.', en: 'Today is Monday, 5th March.' },
            { de: 'Am Freitag gehe ich ins Kino.', en: 'On Friday I go to the cinema.' },
          ]}
        />
      </Section>
    </>
  );
}

// ─── REGISTRY ────────────────────────────────────────────────────────────────

const THEORY_REGISTRY: Record<string, React.FC> = {
  praesens: Praesens,
  'noun-gender': NounGender,
  cases: Cases,
  'personal-pronouns': PersonalPronouns,
  'possessive-pronouns': PossessivePronouns,
  'modal-verbs': ModalVerbs,
  'dativ-prepositions': DativPrepositions,
  'akkusativ-prepositions': AkkusativPrepositions,
  'two-way-prepositions': TwoWayPrepositions,
  imperative: Imperative,
  'separable-verbs': SeparableVerbs,
  'future-werden': FutureWerden,
  'numbers-dates-time': NumbersTime,
};

export function TheoryContent({ topic }: { topic: string }) {
  const Component = THEORY_REGISTRY[topic];
  if (!Component) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-500">
        Theory content for this topic is coming soon.
      </div>
    );
  }
  return <Component />;
}
