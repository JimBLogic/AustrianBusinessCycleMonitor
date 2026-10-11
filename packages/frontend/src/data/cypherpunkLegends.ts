/**
 * 🔐 CYPHERPUNK LEGENDS - THE BITCOIN GENESIS STORY
 * 
 * "Privacy is necessary for an open society in the electronic age."
 * - Eric Hughes, A Cypherpunk's Manifesto (1993)
 * 
 * This module honors the visionaries who made Bitcoin possible.
 * Standing on the shoulders of cryptographic giants.
 */

export interface CypherpunkLegend {
  id: string;
  name: string;
  title: string;
  era: string;
  avatar?: string;
  contributions: string[];
  keyWorks: {
    title: string;
    year: number;
    url?: string;
    significance: string;
  }[];
  famousQuotes: string[];
  connections: string[]; // IDs of related legends
  categories: ('cryptography' | 'economics' | 'philosophy' | 'code')[];
  timeline: {
    year: number;
    event: string;
  }[];
  legacy: string;
  readingList: {
    title: string;
    type: 'paper' | 'book' | 'essay' | 'code' | 'manifesto';
    url?: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  }[];
}

/**
 * THE CYPHERPUNK HALL OF FAME
 * Chronological order of contributions to digital freedom
 */
export const cypherpunkLegends: Record<string, CypherpunkLegend> = {
  // ============================================================
  // THE CRYPTOGRAPHY PIONEERS (Pre-Cypherpunk Era)
  // ============================================================
  
  'whitfield-diffie': {
    id: 'whitfield-diffie',
    name: 'Whitfield Diffie',
    title: 'Father of Public Key Cryptography',
    era: '1976 - Present',
    contributions: [
      'Co-inventor of Diffie-Hellman key exchange (1976)',
      'Revolutionary concept of public-key cryptography',
      'Enabled secure communication without pre-shared secrets',
      'Foundation for all modern digital signatures'
    ],
    keyWorks: [
      {
        title: 'New Directions in Cryptography',
        year: 1976,
        url: 'https://ee.stanford.edu/~hellman/publications/24.pdf',
        significance: 'Introduced public-key cryptography, changing cryptography forever'
      }
    ],
    famousQuotes: [
      'We stand today on the brink of a revolution in cryptography.',
      'Without privacy, freedom of expression is meaningless.'
    ],
    connections: ['david-chaum', 'phil-zimmermann', 'adam-back'],
    categories: ['cryptography', 'philosophy'],
    timeline: [
      { year: 1976, event: 'Published "New Directions in Cryptography" with Martin Hellman' },
      { year: 2015, event: 'Received Turing Award for public-key cryptography' }
    ],
    legacy: 'Made Bitcoin\'s digital signatures possible. Every Bitcoin transaction uses the public-key cryptography Diffie pioneered.',
    readingList: [
      {
        title: 'New Directions in Cryptography',
        type: 'paper',
        url: 'https://ee.stanford.edu/~hellman/publications/24.pdf',
        difficulty: 'advanced'
      },
      {
        title: 'Privacy on the Line',
        type: 'book',
        difficulty: 'intermediate'
      }
    ]
  },

  'david-chaum': {
    id: 'david-chaum',
    name: 'David Chaum',
    title: 'Inventor of Digital Cash',
    era: '1982 - Present',
    contributions: [
      'Invented blind signatures (1982)',
      'Created first digital cash system: eCash (1989)',
      'Pioneered cryptographic anonymity techniques',
      'Founded DigiCash - first digital currency company',
      'Invented mix networks for anonymous communication'
    ],
    keyWorks: [
      {
        title: 'Blind Signatures for Untraceable Payments',
        year: 1982,
        url: 'https://sceweb.sce.uhcl.edu/yang/teaching/csci5234WebSecurityFall2011/Chaum-blind-signatures.PDF',
        significance: 'First proposal for cryptographic digital cash with privacy'
      },
      {
        title: 'Security without Identification',
        year: 1985,
        significance: 'Introduced concept of privacy-preserving transactions'
      }
    ],
    famousQuotes: [
      'Privacy and anonymity are essential for democracy.',
      'The only way to have privacy is to give people the tools to protect it themselves.'
    ],
    connections: ['satoshi-nakamoto', 'wei-dai', 'nick-szabo'],
    categories: ['cryptography', 'economics'],
    timeline: [
      { year: 1982, event: 'Invented blind signatures' },
      { year: 1989, event: 'Founded DigiCash, created eCash' },
      { year: 1990, event: 'eCash implemented in real banks' },
      { year: 1998, event: 'DigiCash declared bankruptcy' }
    ],
    legacy: 'The godfather of digital currency. Satoshi studied eCash extensively. Bitcoin solves the centralization problem that killed DigiCash.',
    readingList: [
      {
        title: 'Blind Signatures for Untraceable Payments',
        type: 'paper',
        url: 'https://sceweb.sce.uhcl.edu/yang/teaching/csci5234WebSecurityFall2011/Chaum-blind-signatures.PDF',
        difficulty: 'advanced'
      },
      {
        title: 'Security without Identification: Transaction Systems to Make Big Brother Obsolete',
        type: 'paper',
        difficulty: 'intermediate'
      }
    ]
  },

  // ============================================================
  // THE CYPHERPUNK MOVEMENT (1990s)
  // ============================================================

  'timothy-may': {
    id: 'timothy-may',
    name: 'Timothy C. May',
    title: 'Author of The Crypto Anarchist Manifesto',
    era: '1988 - 2018',
    contributions: [
      'Wrote The Crypto Anarchist Manifesto (1988)',
      'Co-founded Cypherpunks mailing list (1992)',
      'Predicted Bitcoin-like systems in 1992',
      'Advocated for crypto-anarchism and digital freedom',
      'Inspired generation of cryptographers'
    ],
    keyWorks: [
      {
        title: 'The Crypto Anarchist Manifesto',
        year: 1988,
        url: 'https://nakamotoinstitute.org/library/crypto-anarchist-manifesto/',
        significance: 'Predicted anonymous digital cash and encrypted markets'
      },
      {
        title: 'Cyphernomicon',
        year: 1994,
        url: 'https://nakamotoinstitute.org/static/docs/cyphernomicon.txt',
        significance: 'Comprehensive FAQ on crypto-anarchy and digital freedom'
      }
    ],
    famousQuotes: [
      'The State will of course try to slow or halt the spread of this technology, citing national security concerns... But this will not halt the spread of crypto anarchy.',
      'Crypto anarchy is the cyberspatial realization of anarcho-capitalism.',
      'Just as a seemingly minor invention like barbed wire made possible the fencing-off of vast ranches and farms, thus altering forever the concepts of land and property rights in the frontier West, so too will the seemingly minor discovery out of an arcane branch of mathematics come to be the wire clippers which dismantle the barbed wire around intellectual property.'
    ],
    connections: ['eric-hughes', 'john-gilmore', 'hal-finney', 'nick-szabo'],
    categories: ['philosophy', 'cryptography'],
    timeline: [
      { year: 1988, event: 'Wrote The Crypto Anarchist Manifesto' },
      { year: 1992, event: 'Co-founded Cypherpunks mailing list' },
      { year: 1994, event: 'Published The Cyphernomicon' },
      { year: 2018, event: 'Passed away, legacy lives in Bitcoin' }
    ],
    legacy: 'The prophet of crypto-anarchy. His manifestos predicted Bitcoin\'s ability to undermine state control of money. RIP.',
    readingList: [
      {
        title: 'The Crypto Anarchist Manifesto',
        type: 'manifesto',
        url: 'https://nakamotoinstitute.org/library/crypto-anarchist-manifesto/',
        difficulty: 'beginner'
      },
      {
        title: 'The Cyphernomicon',
        type: 'essay',
        url: 'https://nakamotoinstitute.org/static/docs/cyphernomicon.txt',
        difficulty: 'intermediate'
      }
    ]
  },

  'eric-hughes': {
    id: 'eric-hughes',
    name: 'Eric Hughes',
    title: 'Author of A Cypherpunk\'s Manifesto',
    era: '1993 - Present',
    contributions: [
      'Wrote A Cypherpunk\'s Manifesto (1993)',
      'Co-founded Cypherpunks mailing list',
      'Defined cypherpunk philosophy',
      'Advocated for privacy as a human right'
    ],
    keyWorks: [
      {
        title: 'A Cypherpunk\'s Manifesto',
        year: 1993,
        url: 'https://nakamotoinstitute.org/library/cypherpunk-manifesto/',
        significance: 'Defining document of the cypherpunk movement'
      }
    ],
    famousQuotes: [
      'Privacy is necessary for an open society in the electronic age.',
      'Cypherpunks write code.',
      'Privacy is not secrecy. A private matter is something one doesn\'t want the whole world to know, but a secret matter is something one doesn\'t want anybody to know.',
      'We cannot expect governments, corporations, or other large, faceless organizations to grant us privacy... We must defend our own privacy if we expect to have any.'
    ],
    connections: ['timothy-may', 'john-gilmore', 'hal-finney'],
    categories: ['philosophy', 'code'],
    timeline: [
      { year: 1992, event: 'Co-founded Cypherpunks mailing list' },
      { year: 1993, event: 'Published A Cypherpunk\'s Manifesto' }
    ],
    legacy: '"Cypherpunks write code." This ethos led directly to Bitcoin. Satoshi didn\'t ask permission - he wrote code.',
    readingList: [
      {
        title: 'A Cypherpunk\'s Manifesto',
        type: 'manifesto',
        url: 'https://nakamotoinstitute.org/library/cypherpunk-manifesto/',
        difficulty: 'beginner'
      }
    ]
  },

  'john-gilmore': {
    id: 'john-gilmore',
    name: 'John Gilmore',
    title: 'Co-founder of Cypherpunks & EFF',
    era: '1990 - Present',
    contributions: [
      'Co-founded Cypherpunks mailing list (1992)',
      'Co-founded Electronic Frontier Foundation (1990)',
      'Fought crypto export restrictions',
      'Early employee at Sun Microsystems',
      'Major Bitcoin early adopter'
    ],
    keyWorks: [
      {
        title: 'Cypherpunks Mailing List',
        year: 1992,
        significance: 'Created forum where Bitcoin was eventually born'
      }
    ],
    famousQuotes: [
      'The Net interprets censorship as damage and routes around it.',
      'I want a guarantee -- with physics and mathematics, not with laws -- that we can give ourselves real privacy of personal communications.'
    ],
    connections: ['timothy-may', 'eric-hughes', 'phil-zimmermann'],
    categories: ['philosophy', 'code'],
    timeline: [
      { year: 1990, event: 'Co-founded Electronic Frontier Foundation' },
      { year: 1992, event: 'Co-founded Cypherpunks mailing list' },
      { year: 1995, event: 'Fought crypto export laws (Bernstein v. United States)' }
    ],
    legacy: 'Provided the infrastructure (mailing list) where cypherpunk ideas flourished. Bitcoin\'s ancestors were discussed here.',
    readingList: [
      {
        title: 'Cypherpunks Mailing List Archives',
        type: 'essay',
        url: 'https://mailing-list-archive.cryptoanarchy.wiki/',
        difficulty: 'intermediate'
      }
    ]
  },

  'phil-zimmermann': {
    id: 'phil-zimmermann',
    name: 'Phil Zimmermann',
    title: 'Creator of PGP (Pretty Good Privacy)',
    era: '1991 - Present',
    contributions: [
      'Created PGP encryption software (1991)',
      'Made military-grade encryption available to civilians',
      'Fought US government prosecution for cryptography',
      'Democratized privacy tools globally'
    ],
    keyWorks: [
      {
        title: 'PGP (Pretty Good Privacy)',
        year: 1991,
        url: 'https://www.philzimmermann.com/EN/essays/WhyIWrotePGP.html',
        significance: 'First widely available public-key encryption for the masses'
      },
      {
        title: 'Why I Wrote PGP',
        year: 1991,
        significance: 'Explained the moral imperative for strong encryption'
      }
    ],
    famousQuotes: [
      'If privacy is outlawed, only outlaws will have privacy.',
      'PGP empowers people to take their privacy into their own hands.'
    ],
    connections: ['eric-hughes', 'john-gilmore', 'adam-back'],
    categories: ['cryptography', 'code', 'philosophy'],
    timeline: [
      { year: 1991, event: 'Released PGP 1.0' },
      { year: 1993, event: 'Investigated by US government for "munitions export"' },
      { year: 1996, event: 'Charges dropped' }
    ],
    legacy: 'Proved that individuals could deploy unbreakable cryptography. Paved way for Bitcoin\'s cryptographic sovereignty.',
    readingList: [
      {
        title: 'Why I Wrote PGP',
        type: 'essay',
        url: 'https://www.philzimmermann.com/EN/essays/WhyIWrotePGP.html',
        difficulty: 'beginner'
      }
    ]
  },

  // ============================================================
  // THE DIGITAL CASH PIONEERS
  // ============================================================

  'wei-dai': {
    id: 'wei-dai',
    name: 'Wei Dai',
    title: 'Creator of b-money',
    era: '1998 - Present',
    contributions: [
      'Proposed b-money (1998) - proto-Bitcoin',
      'Introduced concept of distributed ledger',
      'Described proof-of-work for money creation',
      'Influenced Bitcoin\'s design directly',
      'Satoshi cited b-money in Bitcoin whitepaper'
    ],
    keyWorks: [
      {
        title: 'b-money',
        year: 1998,
        url: 'http://www.weidai.com/bmoney.txt',
        significance: 'First description of decentralized digital currency with proof-of-work'
      }
    ],
    famousQuotes: [
      'I am fascinated by Tim May\'s crypto-anarchy.',
      'Every participant maintains a separate database of how much money belongs to each pseudonym.'
    ],
    connections: ['satoshi-nakamoto', 'adam-back', 'hal-finney', 'nick-szabo'],
    categories: ['cryptography', 'economics', 'code'],
    timeline: [
      { year: 1998, event: 'Published b-money proposal' },
      { year: 2008, event: 'Satoshi Nakamoto emails Wei Dai about Bitcoin' },
      { year: 2009, event: 'Bitcoin references b-money' }
    ],
    legacy: 'Satoshi called Bitcoin "an implementation of Wei Dai\'s b-money proposal." b-money is Bitcoin\'s grandfather.',
    readingList: [
      {
        title: 'b-money',
        type: 'paper',
        url: 'http://www.weidai.com/bmoney.txt',
        difficulty: 'intermediate'
      }
    ]
  },

  'nick-szabo': {
    id: 'nick-szabo',
    name: 'Nick Szabo',
    title: 'Creator of Bit Gold, Pioneer of Smart Contracts',
    era: '1998 - Present',
    contributions: [
      'Proposed Bit Gold (1998) - most similar to Bitcoin',
      'Invented concept of "smart contracts" (1994)',
      'Wrote extensively on digital money and cryptography',
      'Developed theory of "unforgeable costliness"',
      'Major influence on Satoshi Nakamoto'
    ],
    keyWorks: [
      {
        title: 'Bit Gold',
        year: 1998,
        url: 'https://nakamotoinstitute.org/library/bit-gold/',
        significance: 'Closest precursor to Bitcoin, used proof-of-work for scarce digital money'
      },
      {
        title: 'Shelling Out: The Origins of Money',
        year: 2002,
        url: 'https://nakamotoinstitute.org/library/shelling-out/',
        significance: 'Explained evolutionary origins of money and value'
      },
      {
        title: 'Smart Contracts',
        year: 1994,
        significance: 'Introduced programmable, self-executing contracts'
      }
    ],
    famousQuotes: [
      'Trusted third parties are security holes.',
      'Gold is the money of kings, silver is the money of gentlemen, barter is the money of peasants, but debt is the money of slaves.',
      'What the Internet is to telecommunications, Bitcoin is to money.',
      'Instead of my money being held by a company, it\'s held by mathematics.'
    ],
    connections: ['wei-dai', 'hal-finney', 'adam-back', 'satoshi-nakamoto'],
    categories: ['cryptography', 'economics', 'philosophy'],
    timeline: [
      { year: 1994, event: 'Introduced smart contracts concept' },
      { year: 1998, event: 'Designed Bit Gold architecture' },
      { year: 2002, event: 'Published "Shelling Out"' },
      { year: 2005, event: 'Wrote about Bit Gold publicly' }
    ],
    legacy: 'Many believe Szabo is Satoshi Nakamoto (he denies it). Bit Gold was nearly identical to Bitcoin. Smart contracts now power DeFi.',
    readingList: [
      {
        title: 'Shelling Out: The Origins of Money',
        type: 'essay',
        url: 'https://nakamotoinstitute.org/library/shelling-out/',
        difficulty: 'beginner'
      },
      {
        title: 'Bit Gold',
        type: 'paper',
        url: 'https://nakamotoinstitute.org/library/bit-gold/',
        difficulty: 'advanced'
      },
      {
        title: 'Trusted Third Parties Are Security Holes',
        type: 'essay',
        url: 'https://nakamotoinstitute.org/library/trusted-third-parties/',
        difficulty: 'intermediate'
      }
    ]
  },

  'adam-back': {
    id: 'adam-back',
    name: 'Adam Back',
    title: 'Inventor of Hashcash (Bitcoin\'s Proof-of-Work)',
    era: '1997 - Present',
    contributions: [
      'Invented Hashcash (1997) - Bitcoin\'s proof-of-work algorithm',
      'Solved email spam with computational cost',
      'Only person cited in Bitcoin whitepaper',
      'CEO of Blockstream',
      'Corresponded with Satoshi pre-Bitcoin'
    ],
    keyWorks: [
      {
        title: 'Hashcash - A Denial of Service Counter-Measure',
        year: 1997,
        url: 'http://www.hashcash.org/papers/hashcash.pdf',
        significance: 'Invented the proof-of-work system Bitcoin uses for mining'
      }
    ],
    famousQuotes: [
      'Bitcoin is digital gold.',
      'Hashcash is a proof-of-work algorithm, which has been used as a denial-of-service counter measure technique.',
      'To be resistant to censorship, money needs to be bearer form.'
    ],
    connections: ['wei-dai', 'nick-szabo', 'hal-finney', 'satoshi-nakamoto'],
    categories: ['cryptography', 'code'],
    timeline: [
      { year: 1997, event: 'Invented Hashcash for email spam prevention' },
      { year: 2002, event: 'Published Hashcash paper' },
      { year: 2008, event: 'Satoshi emails Adam about Bitcoin' },
      { year: 2014, event: 'Co-founded Blockstream' }
    ],
    legacy: 'Bitcoin IS Hashcash. Every block mined uses Adam\'s proof-of-work invention. Satoshi called it "an implementation of Hashcash."',
    readingList: [
      {
        title: 'Hashcash - A Denial of Service Counter-Measure',
        type: 'paper',
        url: 'http://www.hashcash.org/papers/hashcash.pdf',
        difficulty: 'advanced'
      }
    ]
  },

  // ============================================================
  // HAL FINNEY - THE FIRST BITCOINER
  // ============================================================

  'hal-finney': {
    id: 'hal-finney',
    name: 'Hal Finney',
    title: 'The First Bitcoiner (RIP 🕊️)',
    era: '1992 - 2014',
    contributions: [
      'First person besides Satoshi to run Bitcoin (2009)',
      'Received first Bitcoin transaction from Satoshi',
      'Created RPOW (Reusable Proofs of Work) in 2004',
      'Early PGP contributor and cypherpunk',
      'Improved Bitcoin code and found bugs',
      'Ran Bitcoin node from home while battling ALS',
      'True cypherpunk: wrote code until his last days'
    ],
    keyWorks: [
      {
        title: 'RPOW - Reusable Proofs of Work',
        year: 2004,
        url: 'https://nakamotoinstitute.org/finney/rpow/',
        significance: 'First implementation of reusable proof-of-work tokens'
      },
      {
        title: 'Bitcoin and Me',
        year: 2013,
        url: 'https://bitcointalk.org/index.php?topic=155054.0',
        significance: 'Hal\'s reflection on Bitcoin\'s early days'
      }
    ],
    famousQuotes: [
      'Running bitcoin',
      'It\'s very attractive to the libertarian viewpoint if we can explain it properly.',
      'One thing I might mention is that in my background as a cryptographer, I\'ve always been interested in various kinds of money systems.',
      'I thought I was responding to a request for help from someone who might be Satoshi Nakamoto.'
    ],
    connections: ['satoshi-nakamoto', 'adam-back', 'nick-szabo', 'wei-dai'],
    categories: ['cryptography', 'code', 'economics'],
    timeline: [
      { year: 1992, event: 'Active in Cypherpunks mailing list' },
      { year: 1993, event: 'Contributed to PGP development' },
      { year: 2004, event: 'Created RPOW' },
      { year: 2009, event: 'First Bitcoin transaction (from Satoshi)' },
      { year: 2009, event: 'Tweeted "Running bitcoin"' },
      { year: 2009, event: 'Diagnosed with ALS' },
      { year: 2013, event: 'Posted "Bitcoin and Me" on BitcoinTalk' },
      { year: 2014, event: 'Passed away, cryopreserved at Alcor' }
    ],
    legacy: 'Saint Hal. The purest cypherpunk. He HODL\'d until death, his coins never moved. Proof-of-diamond-hands. RIP to a real one. 🕊️💎',
    readingList: [
      {
        title: 'Bitcoin and Me (Hal Finney)',
        type: 'essay',
        url: 'https://bitcointalk.org/index.php?topic=155054.0',
        difficulty: 'beginner'
      },
      {
        title: 'RPOW - Reusable Proofs of Work',
        type: 'code',
        url: 'https://nakamotoinstitute.org/finney/rpow/',
        difficulty: 'advanced'
      },
      {
        title: 'Detecting Double Spending',
        type: 'essay',
        url: 'https://nakamotoinstitute.org/finney/detecting-double-spending/',
        difficulty: 'intermediate'
      }
    ]
  },

  // ============================================================
  // SATOSHI NAKAMOTO - THE MYSTERY
  // ============================================================

  'satoshi-nakamoto': {
    id: 'satoshi-nakamoto',
    name: 'Satoshi Nakamoto',
    title: 'Creator of Bitcoin (Identity Unknown)',
    era: '2008 - 2011',
    contributions: [
      'Created Bitcoin - first decentralized digital currency (2008-2009)',
      'Solved the Byzantine Generals Problem',
      'Invented blockchain technology',
      'Mined ~1 million BTC (never moved)',
      'Disappeared in 2011, never revealed identity',
      'Changed the world forever'
    ],
    keyWorks: [
      {
        title: 'Bitcoin: A Peer-to-Peer Electronic Cash System',
        year: 2008,
        url: 'https://bitcoin.org/bitcoin.pdf',
        significance: 'The Bitcoin whitepaper - most important document in cryptocurrency'
      }
    ],
    famousQuotes: [
      'The root problem with conventional currency is all the trust that\'s required to make it work.',
      'The nature of Bitcoin is such that once version 0.1 was released, the core design was set in stone for the rest of its lifetime.',
      'If you don\'t believe it or don\'t get it, I don\'t have the time to try to convince you, sorry.',
      'Lost coins only make everyone else\'s coins worth slightly more. Think of it as a donation to everyone.'
    ],
    connections: ['hal-finney', 'wei-dai', 'adam-back', 'nick-szabo'],
    categories: ['cryptography', 'economics', 'code', 'philosophy'],
    timeline: [
      { year: 2008, event: 'Registered bitcoin.org domain' },
      { year: 2008, event: 'Posted Bitcoin whitepaper to cryptography mailing list' },
      { year: 2009, event: 'Mined genesis block (January 3)' },
      { year: 2009, event: 'First Bitcoin transaction to Hal Finney' },
      { year: 2010, event: 'Handed over Bitcoin development' },
      { year: 2011, event: 'Last known communication, disappeared forever' }
    ],
    legacy: 'The anonymous architect. Created the most revolutionary technology since the internet. Never sought fame or fortune. ~1M BTC never touched. The ultimate HODL. In Satoshi we trust.',
    readingList: [
      {
        title: 'Bitcoin Whitepaper',
        type: 'paper',
        url: 'https://bitcoin.org/bitcoin.pdf',
        difficulty: 'intermediate'
      },
      {
        title: 'Satoshi\'s Emails',
        type: 'essay',
        url: 'https://satoshi.nakamotoinstitute.org/emails/',
        difficulty: 'beginner'
      },
      {
        title: 'Satoshi\'s Forum Posts',
        type: 'essay',
        url: 'https://satoshi.nakamotoinstitute.org/posts/',
        difficulty: 'beginner'
      }
    ]
  }
};

/**
 * CYPHERPUNK TIMELINE
 * The path to Bitcoin
 */
export const cypherpunkTimeline = [
  { year: 1976, event: 'Diffie-Hellman: Public-key cryptography invented', icon: '🔑', category: 'cryptography' },
  { year: 1982, event: 'David Chaum: Blind signatures invented', icon: '🕵️', category: 'cryptography' },
  { year: 1985, event: 'Chaum: "Security without Identification"', icon: '🔐', category: 'philosophy' },
  { year: 1988, event: 'Timothy May: Crypto Anarchist Manifesto', icon: '📜', category: 'philosophy' },
  { year: 1989, event: 'DigiCash founded, eCash created', icon: '💳', category: 'economics' },
  { year: 1991, event: 'Phil Zimmermann: PGP released', icon: '✉️', category: 'cryptography' },
  { year: 1992, event: 'Cypherpunks mailing list founded', icon: '📧', category: 'philosophy' },
  { year: 1993, event: 'Eric Hughes: A Cypherpunk\'s Manifesto', icon: '📖', category: 'philosophy' },
  { year: 1997, event: 'Adam Back: Hashcash invented', icon: '⛏️', category: 'cryptography' },
  { year: 1998, event: 'Wei Dai: b-money proposal', icon: '💰', category: 'economics' },
  { year: 1998, event: 'Nick Szabo: Bit Gold designed', icon: '🥇', category: 'economics' },
  { year: 2004, event: 'Hal Finney: RPOW created', icon: '🔄', category: 'cryptography' },
  { year: 2008, event: 'Satoshi: Bitcoin whitepaper published', icon: '₿', category: 'economics' },
  { year: 2009, event: 'Bitcoin network launched (Genesis Block)', icon: '⛓️', category: 'code' },
  { year: 2009, event: 'First Bitcoin transaction (Satoshi → Hal)', icon: '⚡', category: 'code' },
  { year: 2010, event: 'Bitcoin Pizza Day (10,000 BTC)', icon: '🍕', category: 'economics' },
  { year: 2011, event: 'Satoshi disappears', icon: '👻', category: 'philosophy' },
  { year: 2013, event: 'Bitcoin crosses $1,000', icon: '📈', category: 'economics' },
  { year: 2017, event: 'Bitcoin reaches $20,000', icon: '🚀', category: 'economics' },
  { year: 2021, event: 'Bitcoin becomes legal tender (El Salvador)', icon: '🇸🇻', category: 'economics' },
  { year: 2024, event: 'Bitcoin ETFs approved', icon: '🏦', category: 'economics' },
];

/**
 * MUST-READ RESOURCES
 */
export const cypherpunkLibrary = {
  manifestos: [
    {
      title: 'The Crypto Anarchist Manifesto',
      author: 'Timothy C. May',
      year: 1988,
      url: 'https://nakamotoinstitute.org/library/crypto-anarchist-manifesto/',
      difficulty: 'beginner',
      readTime: '5 min'
    },
    {
      title: 'A Cypherpunk\'s Manifesto',
      author: 'Eric Hughes',
      year: 1993,
      url: 'https://nakamotoinstitute.org/library/cypherpunk-manifesto/',
      difficulty: 'beginner',
      readTime: '5 min'
    }
  ],
  
  technicalPapers: [
    {
      title: 'Bitcoin: A Peer-to-Peer Electronic Cash System',
      author: 'Satoshi Nakamoto',
      year: 2008,
      url: 'https://bitcoin.org/bitcoin.pdf',
      difficulty: 'intermediate',
      readTime: '30 min'
    },
    {
      title: 'b-money',
      author: 'Wei Dai',
      year: 1998,
      url: 'http://www.weidai.com/bmoney.txt',
      difficulty: 'intermediate',
      readTime: '15 min'
    },
    {
      title: 'Bit Gold',
      author: 'Nick Szabo',
      year: 2005,
      url: 'https://nakamotoinstitute.org/library/bit-gold/',
      difficulty: 'advanced',
      readTime: '20 min'
    },
    {
      title: 'Hashcash - A Denial of Service Counter-Measure',
      author: 'Adam Back',
      year: 2002,
      url: 'http://www.hashcash.org/papers/hashcash.pdf',
      difficulty: 'advanced',
      readTime: '45 min'
    }
  ],
  
  books: [
    {
      title: 'The Bitcoin Standard',
      author: 'Saifedean Ammous',
      year: 2018,
      difficulty: 'beginner',
      description: 'Austrian economics meets Bitcoin'
    },
    {
      title: 'The Sovereign Individual',
      author: 'James Dale Davidson & Lord William Rees-Mogg',
      year: 1997,
      difficulty: 'intermediate',
      description: 'Predicted Bitcoin 12 years early'
    },
    {
      title: 'Cryptonomicon',
      author: 'Neal Stephenson',
      year: 1999,
      difficulty: 'beginner',
      description: 'Fiction that inspired cypherpunks'
    }
  ]
};

/**
 * FAMOUS CYPHERPUNK QUOTES
 */
export const iconicQuotes = [
  {
    quote: 'Cypherpunks write code.',
    author: 'Eric Hughes',
    year: 1993,
    context: 'A Cypherpunk\'s Manifesto'
  },
  {
    quote: 'The Net interprets censorship as damage and routes around it.',
    author: 'John Gilmore',
    year: 1993,
    context: 'On internet freedom'
  },
  {
    quote: 'Trusted third parties are security holes.',
    author: 'Nick Szabo',
    year: 2001,
    context: 'On centralized systems'
  },
  {
    quote: 'If privacy is outlawed, only outlaws will have privacy.',
    author: 'Phil Zimmermann',
    year: 1991,
    context: 'On PGP and cryptography rights'
  },
  {
    quote: 'The root problem with conventional currency is all the trust that\'s required to make it work.',
    author: 'Satoshi Nakamoto',
    year: 2009,
    context: 'Genesis block message'
  },
  {
    quote: 'Running bitcoin',
    author: 'Hal Finney',
    year: 2009,
    context: 'First tweet about Bitcoin (January 11, 2009)'
  }
];

export default cypherpunkLegends;
