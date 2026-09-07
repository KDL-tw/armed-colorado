# Gun Bill Catalog Creation Cleanup

## Mission
You will cleanup and make more legible the Billwatch page of the Armed Colorado website.


## Agent System
Your agentic system is a hermes agent running Qwen3.8-27B as an unsloth UD-Q6_K_M quant. The unsloth writeup can be found here: https://unsloth.ai/docs/models/qwen3.8 and the hermes agent writeup can be found here: https://hermes-agent.nousresearch.com/docs/assets/files/llms-7240021af84660c2a79f9fdaf65e9e8f.txt.

Fully review the hermes agent writeup and the Qwen3.8 writeup, understand your capabilities for both the model and hermes, and utilize your capabilities in the execution of this mission. You must do this first before writing any code. 


---
## Reference Materials
- [unsloth writeup of Qwen3.8-27B](https://unsloth.ai/docs/models/qwen3.8)
- [hermes agent writeup](https://hermes-agent.nousresearch.com/docs/assets/files/llms-7240021af84660c2a79f9fdaf65e9e8f.txt)
- [rocky mountain gun owners (RMGO) billwatch]( https://hermes-agent.nousresearch.com/docs/assets/files/llms-7240021af84660c2a79f9fdaf65e9e8f.txt.)
- [colorado general assembly bill search](https://leg.colorado.gov/bills/bill-search)


---
## Methodology
### Skills and Tools
- [unsloth writeup of Qwen3.8-27B](https://unsloth.ai/docs/models/qwen3.8) for model tools.
- [hermes agent writeup](https://hermes-agent.nousresearch.com/docs/assets/files/llms-7240021af84660c2a79f9fdaf65e9e8f.txt) for hermes agent tools, skills, and capabilities.
- [colorado general assembly bill search](https://leg.colorado.gov/bills/bill-search) is the ground truth and must be used to extract bill title and generate bill summaries.
- Navigating the colorado general assembly bill search website will require a skill or a tool like playwright. 


### Key
- Make methodology reproducible, not vague.


---
## Cleanup Tasks
### Table Formatting
The width of every table is too narrow and makes reading the table difficult. 
- Widen each table so that there is ample space between the fields and the text in the fields so the user can adequately read the material.

### Bill Titles
- The titles of the bills should not come from the RMGO web page, but they should be take from the official bill page on the CO GA website. 
- You can use the RMGO website to obtain the URL for the bill page, but you must not copy the title from the RMGO website.

### Sponsor List Formatting
The sponsor list should not appear sequential. Currently, they are listed like this:
Rep. Manny Rutinel, Rep. Chad Clifford, Sen. Katie Wallace, Sen. William Lindstedt

They must appear underneath each other like this:
Rep. Manny Rutinel
Rep. Chad Clifford
Sen. Katie Wallace
Sen. William Lindstedt

### Bill Summary Rewrites
All bill summaries need to be rewritten, adhering to the following constraints. The bill summaries:
- Must be generated from the most recent version of the bill from the CO GA bill website. 
- Must not be copied from the summary that exists on the CO GA bill website.
- Must not be taken from the RMGO website.
- Must be displayed fully in the table. No elipses at the end indicating truncation.

### Page Formatting
Remove the following text from the "Billwatch" heading on the page:
"Every Colorado gun bill — proposed, passed, or died — from the Rocky Mountain Gun Owners billwatch page."

and replace it with:
"Every Colorado gun bill — proposed, passed, or died."



---
## Bounded Execution
- Total time: 72 hours max
- Per-table timeout: 3 hours max
- Revision limit: Max 3 cycles per section
- Escalation: Ask for help after 3 revision cycles


## Success Criteria Checklist
[ ] Every table properly formatted and widened.
[ ] Bill titles extracted from CO GA website.
[ ] Sponsor list appearing one under another.
[ ] Bill summaries generated from the CO GA bill website.
[ ] Bill summaries displayed fully in the table. 
[ ] Heading text under "Billwatch" rewritten. 

## What Counts as [Halluciniations/Errors]
- Hallucination: Factual errors, unsupported claims, or logical inconsistencies.
- Error: Incorrect field values, inconsistent formatting, or missing values. 

## Starting Checklist
[ ] Understand model writeup.
[ ] Understand hermes agent writeup.
[ ] Know methodology.
[ ] Know success criteria.

                                                

---
## Key Mindset
- Trust is earned through verification.
- Better to say 'I don't know' than guess.
- You don't proceed without explicit approval.
- Utilizing all tools and skills available when needed makes work more efficient.


---
## Initial assignment: Begin When Ready
- Understand model writeup and the model capabilities.
- Understand hermes agent writeup and the hermes tools, skills, and capabilities.
- Understand armed-colorado codebase.
- Ask me any clarifying questions.
- Begin implementing cleanup tasks.
        
