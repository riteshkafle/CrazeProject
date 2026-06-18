import type { Company, SequenceStep } from '@/types';

export function generateSequence(company: Company, contactName: string): SequenceStep[] {
  const firstName = contactName.split(' ')[0] || 'there';
  const topPain = company.pains[0];

  return [
    {
      num: 1,
      icon: '📧',
      type: 'Cold Email',
      timing: 'Day 1',
      subject: `${company.name} × Craze — Gen Z insight in 72 hours, not 12 weeks`,
      body: `Hi ${firstName},

Most ${company.name} consumer research tells you what Gen Z said in a room they didn't want to be in. Craze is different.

We run AI-moderated interviews with verified college students — 200+ campuses, 72 hours from kick-off to results. Not surveys. Actual conversations.

Given ${company.name}'s focus on ${topPain.title.toLowerCase()}, I think the timing is right. A 100-student panel can go live in 48 hours with verified participants only, no panel farms.

One question, ${firstName}: what's the #1 consumer question your team needs answered faster right now?

Happy to do a 10-minute demo any time this week.

Best,
[Your Name]
Craze — Gen Z Insights at the Speed of Culture
[Phone] | craze.com`,
    },
    {
      num: 2,
      icon: '💼',
      type: 'LinkedIn Connection Request',
      timing: 'Day 2',
      subject: null,
      body: `Hi ${firstName} — saw your work at ${company.name} and thought it was worth reaching out. I help marketing teams at consumer brands get faster Gen Z insight without the 8-week wait. Happy to share what we're seeing if it's useful.`,
    },
    {
      num: 3,
      icon: '💼',
      type: 'LinkedIn Follow-Up Message',
      timing: 'Day 4',
      subject: null,
      body: `Thanks for connecting, ${firstName}.

Noticed ${company.name} has been making some interesting moves lately — good time to be in the space.

Why I reached out: Craze runs AI-moderated interviews with verified college students and delivers insight in 72 hours. Not panels, not surveys — actual conversations with students who opted in. We've helped brands understand exactly why Gen Z loves (or quietly walks away from) them.

Given the ${topPain.title.toLowerCase()} challenge I imagine you're navigating, I think there's a real fit here.

Would a 15-minute Zoom this week make sense? I can pull up a live example from a brand in an adjacent category — nothing salesy, just a concrete look at what the output is.`,
    },
    {
      num: 4,
      icon: '📞',
      type: 'Cold Call Script',
      timing: 'Day 5',
      subject: null,
      body: `Opener
"Hi, is this ${firstName}? Great — this is [Name] from Craze. Do you have 30 seconds?"

Hook
"We help consumer brands get Gen Z insight in 72 hours instead of 12 weeks. Given ${company.name}'s focus on staying ahead of how fast this generation moves, I thought it was worth a quick call."

Qualifying question
"Quick question — when you need to understand how Gen Z is reacting to something right now, how are you getting that data?"

Pause and listen.

If they're engaged
"That's actually really common. What most of our clients find is traditional research can't keep up. Craze does AI-moderated conversations with verified students, results in 48 hours."

The ask
"Would it be worth 15 minutes on Zoom this week so I can show you a real example? Nothing canned — just a live look at the output."

If they push back on timing
"Totally fair. Can I ask — is it a timing thing, or is faster Gen Z research just not a priority right now? I'd rather know."

Close
"Great. I'll send a calendar link over. Looking forward to it, ${firstName}."`,
    },
    {
      num: 5,
      icon: '📱',
      type: 'Voicemail Script',
      timing: 'Day 5 (if no answer)',
      subject: null,
      body: `"Hi ${firstName}, this is [Name] from Craze. We help brands like ${company.name} get authentic Gen Z insight in 72 hours, straight from verified college students.

I had a specific idea for how this could apply to ${company.name}'s work — thought it was worth 60 seconds of your time.

I'll send you an email with more context. You can also reach me at [phone number]. No obligation — just think the timing is right.

Have a great day."`,
    },
    {
      num: 6,
      icon: '📧',
      type: 'Follow-Up Email',
      timing: 'Day 7',
      subject: `Quick follow-up one thing I forgot to mention`,
      body: `Hi ${firstName},

Sent you a note last week just wanted to add one thing I forgot to mention.

We run a free pilot for qualified brands. One study, 50 college students, no cost, no catch. You get the full Craze experience — AI-moderated interviews, verified participants, a clean insight report — before committing to anything.

For ${company.name}, I'd build the pilot around: "${topPain.desc}"

That's the kind of question that takes a traditional research firm 8 weeks. We've done it in 2 days.

Worth a 20-minute call to scope it out?

Best,
[Your Name]

P.S. Happy to send a case study from a brand in an adjacent space if that's more useful right now.`,
    },
    {
      num: 7,
      icon: '📧',
      type: 'Final Breakup Email',
      timing: 'Day 21',
      subject: `Closing the loop on Craze + ${company.name}`,
      body: `Hi ${firstName},

I've reached out a few times and haven't heard back — which usually means the timing is off, it's not a priority, or my emails just aren't landing. All fair.

This'll be my last one.

But if faster Gen Z insight ever becomes urgent for ${company.name} a product launch, a brand health question, a competitive move that catches you off guard — I'd love to be the first call you make. We can turn a study around in 72 hours with verified students and AI-moderated conversations. Free pilot available too.

Wishing the team continued success.

[Your Name]
[Phone] | craze.com

P.S. If now actually is a good time and you've just been slammed — I'm one reply away.`,
    },
  ];
}

/** Returns the initials from a full name (e.g. "Maya Chen" → "MC") */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('');
}
