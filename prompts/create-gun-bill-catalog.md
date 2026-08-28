# Gun Bill Catalog Creation

## Mission
You will create a gun bill catalog for the Armed Colorado website. This catalog will consist of tables on a single web page listed in reverse chronological order that displays information about the various gun bills for that year. 

## Agent System
Your agentic system is a hermes agent running qwen3-coder-next as an unsloth UD-Q4-K_XL quant. The unsloth writeup can be found here: https://unsloth.ai/docs/models/qwen3-coder-next.md?displayAgentInstructions=false and the hermes agent writeup can be found here: https://hermes-agent.nousresearch.com/docs/assets/files/llms-7240021af84660c2a79f9fdaf65e9e8f.txt.

Fully review the hermes agent writeup and the qwen3-code-next writeup, understand your capabilities for both the model and hermes, and utilize your capabilities in the execution of this mission. You must do this first before writing any code. 


---
## Reference Materials
- [unsloth writeup of qwen3-coder-next](https://unsloth.ai/docs/models/qwen3-coder-next.md?displayAgentInstructions=false)
- [hermes agent writeup](https://hermes-agent.nousresearch.com/docs/assets/files/llms-7240021af84660c2a79f9fdaf65e9e8f.txt)
- [rocky mountain gun owners (RMGO) billwatch]( https://hermes-agent.nousresearch.com/docs/assets/files/llms-7240021af84660c2a79f9fdaf65e9e8f.txt.)
- [colorado general assembly bill search](https://leg.colorado.gov/bills/bill-search)


---
## Methodology
### Skills and Tools
- [unsloth writeup of qwen3-coder-next](https://unsloth.ai/docs/models/qwen3-coder-next.md?displayAgentInstructions=false) for model tools.
- [hermes agent writeup](https://hermes-agent.nousresearch.com/docs/assets/files/llms-7240021af84660c2a79f9fdaf65e9e8f.txt) for hermes agent tools, skills, and capabilities.
- It is ok to copy data from RMGO website.
- [colorado general assembly bill search](https://leg.colorado.gov/bills/bill-search) is the ground truth.
- Navigating the colorado general assembly bill search website will require a school or a tool like playwright. 


### Key
- Make methodology reproducible, not vague.


---
## Page Layout
- This gun bill catalog will consist of several tables all displayed in reverse chronological order on a single web page. The tables will be identical in structure but will vary in size. 
- Use the layout that already exists under "Billwatch" of the webpage. Keep the top text that starts with "Legislation Billwatch", remove the API stub and the request access stuff, as well as the "expected fields" text near the bottom. 
- Replace these with the tables described below. 


## Table Layout and Field Descriptions
Each table will consist of the following:
- Title of table above the actual table in a larger font.
- This title will be formatted as follows: YEAR Bills - Colorado General Assembly.
- The following fields, appearing in order in the table as they do here. In addition to the field names, I have provided a brief description of the field: 
  - Postion: [Support, Oppose, Ammend]. Support should be in green color text, Oppose in red, and Ammend in blue.
  - Status: [Signed into law, Killed in Committee, Passed House, Passed Senate, Held-over]. "Signed into law" should be bolded, "Killed in Committee" should be red.
  - Bill Number: The bill number from the Colorado General Assembly website bill search page.
  - Title: The title of the bill from the Colorado General Assembly website bill search page. The text of this field should also be a hyperlink that links to the actual bill page on the Colorado General Assembly website.
  - Summary: A summary of the bill from the point of view of a second amendment (2A) advocate. This should be no more than 4 sentences that explains the essence of the bill.
  - Sponsor(s): List of sponsors on the bill from the Colorado General Assembly website.

Utilize the RMGO website to pull the data from. If you need more details, the Colorado General Assembly bill search link above will help.


-------------------------------------------------------------------------------
## Bounded Execution
- Total time: 72 hours max
- Per-table timeout: 3 hours max
- Revision limit: Max 3 cycles per section
- Escalation: Ask for help after 3 revision cycles


## Success Criteria Checklist
[ ] A table for every year starting in 2026 and ending in 1998.
[ ] Each table has every field value filled in with 100% accuracy.
[ ] "Position" field values in each table are properly colored.
[ ] "Status" field values in each table are properly colored. 
[ ] "Bill Number" field values filled in each table with 100% accuracy.
[ ] "Title" field values filled in for each table, with 100% accuracy, and properly hyperlinked to the bill page on the Colorado Genearl Assembly website.
[ ] "Summary" field values generated, exactly 4 sentences long, and filled in for the table.
[ ] "Sponsor(s)" field values filled in and 100% accurate.
 

## What Counts as [Halluciniations/Errors]
- Hallucination: Factual errors, unsupported claims, or logical inconsistencies.
- Error: Incorrect field values, inconsistent formatting, or missing values. 


---
## Starting Checklist
[ ] Understand model writeup.
[ ] Understand hermes agent writeup.
[ ] Know methodology.
[ ] Know success criteria.
[ ] Know web page and table layouts as well as field values and descriptions.
                                                

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
- Begin creating gun bill catalog. 
        
