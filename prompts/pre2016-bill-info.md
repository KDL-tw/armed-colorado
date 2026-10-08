# How to Find Information about Pre-2016 Gun Bill From the Colorado Legislative Sessions
For pre-2016 legislative sessions, information about those sessions can be found using this website here: https://content.leg.colorado.gov/2015-and-prior-legislative-session-information. This document describes the step-by-step procedure a human would take to find information about pre-2016 gun bills from the Colorado legislative sessions and outlines tools that an agent can use to be successful.

## Required Reading - Complete BEFORE Proceeding
Armed Colorado Website Project Root: /home/noether/renhorne/armed-colorado

## Mandatory Deliverables
1) Correct bill titles on the Armed Colorado Billwatch webpage for pre-2016 bills.
2) Correctly hyperlinked text to every bill number on the Armed Colorado Billwatch webpage for pre-2016 bills.
3) Full removal of the Position column of the Billwatch page on the Armed Colorado website for every bill.

## Mission
Put the correct bill title and hyperlinked bill text for every pre-2016 bill on the Billwatch page of the Armed Colorado website. 

### Finding the Official Bill Title of Pre-2016 Gun Bills
Prior sessions are displayed in a table and hyperlinked. What I have to do to find a particular bill is the following:
- Find the correct session year in the table
- For that session year, in the column titled Bills, Resolutions, and Memorials, click the hyperlink titled "House & Senate Bills, Resolutions, and Memorials" for that session year. This hyperlink takes me to archive.leg.state.co.us page for that legislative session year.
- This new archive page has a drop down mennu at the top of the page that says "Select Bill Range." Since I have the bill number for every bill on the website, the numbers that come after the dash tell me the range I need to select. For instance, SB06-157, 157 is the number assigned to that bill, SB stands for "Senate Bill" and "06" is the last 2 digits of the year, namely 2006. In the dropdown menu, for this bill, I would select "Senate Bills 151 - 200" and click the "Go" button.
- Once the new page loads, I would scroll down until I found the matching bill number in the "Bill #" column. For this example, it would be "SB06-157.pdf" and not "Download.wpd".
- Staying in that row, I then go over to the "Title and Sponsors" column, and there is where I find the bill title. For this example that would be "Firearms Transfer Background Checks". That title is what should be used in the Title column of the Billwatch section of the Armed Colorado website.

You are not allowed to move on until you prove to me the first 5 bill titles of the first 5 bills from the 2009 legislative session. 

## Worked Example of Finding the Title of a Pre-2016 Gun Bill
Here is a concrete example:
Suppose I wanted to find the official bill title for HB04-1012. On the Billwatch section of the Armed Colorado website, it is currently set as "CONCERNING CLARIFICATIONS TO THE REQUIREMENT OF OBTAINING A CRIMINAL BACKGROUND CHECK PRIOR TO THE TRANSFER OF A FIREARM AT A GUN SHOW." However, this current title is wrong. To find the correct title for HB04-1012:
- First navigate to https://content.leg.colorado.gov/2015-and-prior-legislative-session-information.
- HB04-1012 means House Bill for the year 2004 and is assigned the number of 1012. Since it's from the 2004 legislative session, I scroll down until I find "2004 Regular Session" in the Session Year column.
- One column over in the "Bills, Resolutions, and Memorials" column is a hyperlink with the text "House & Senate Bills, Resolutions, and Memorials". I would click this hyperlink.
- When the archive.leg.state.co.us finishes loading, I am presented at the top of the page a drop down menu with the default text set to "Select Bill Range."
- Since HB04-1012 has the bill number 1012 and it is a House Bill, I select the dropdown menu and click "House Bills 1001 - 1050" since that is the range that 1012 falls into. I then select "Go".
- Once that page loads, I look at the Bill # column until I see "HB04-1012.pdf". Then one column over in the "Title and Sponsors" column of that same row, I see the official title of the bill, namely, "Gun Show Background Check Clarifications". The text under that title is the sponsors but I don't need that at all for the bill title.
- I would then set the Title column of the billwatch page for the armed colorado website for HB04-1012 to be "Gun Show Background Check Clarifications".

You are not allowed to move on to the next section until you can repeat to me exactly what it says in the History of HB04-1012.

## Creating Hyperlinks in the Armed Colorado Billwatch page for Pre-2016 Bill Text
The above process for acquiring a Pre-2016 bill title can also be used to hyperlink to that bill's text in the Armed Colorado Billwatch section of the website. For instance, on the Armed Colorado Billwatch section of the website, HB11-1205 is hyperlinked under its bill number. However, when I click that hyperlink the webpage that gets loaded takes me to the archive.leg.state.co.us website but it produces an Error 404. 

Instead, if I follow the above process all the way until I get to the archive.leg.state.co.us webpage loading after I have correctly selected the bill number range, finding "HB11-1205.pdf" in the "Bill #" column and clicking THAT hyperlink will give me the bill text in its original form. But, I have to right click "HB11-1205.pdf", select "Copy link" and then that URL will take me to the bill text. This method will successfully give me a url to paste into a browser that takes me to the bill text. That URL is what should be used in the Armed Colorad Billwatch section of the website to hyperlink bill number to corresponding bill text.

You are not allowed to move on to the next section until you can produce the URL for the bill text of bill HB11-1205.

## Tools To Use
Normal site interaction tools and scrapers could be sufficient to perform the above process to discover official bill titles. However, the following tools have been known to be quite useful not only at that but also avoiding rate limits and verification mechanisms:
1) Playwright: https://github.com/microsoft/playwright
2) Crawl4AI: https://github.com/unclecode/crawl4AI
3) puppeteer-extra-plugin-stealth: https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-stealth

All 3 of these tools, either in combination or separate, are renowned for extracting information from a webpage and avoiding authentication. They should be used to help extract information about Pre-2016 bills.

## Deliverable Content
For all pre-2016 bills you will be extracting the official bill title and hyperlink to the bill text. 

First, make sure the tools in the "Tools to Use" section are made available to hermes agent. If they are not installed, install them. crawl4AI is already available to hermes agent.

To extract the bill title:
- you may use the tools outlined in the Tools To Use section if that will help you carry out the process in the "Finding the Official Bill Title of Pre-2016 Gun Bills"
- Extract the official bill title from the "Title and Sponsors" column of the archive.leg.state.co.us website.
- Use that title in the "Title" column of the Armed Colorado Billwatch webpage.
- Use delegation/subagents to run the process mentioned for each individual bill to extract the 

To extract the url for the bill text:
- you may use the tools outlined in the Tools To Use section if that will help you carry out the process in the "Creating Hyperlinks in the Armed Colorado Billwatch page for Pre-2016 Bill Text" section above. 
- Once you have extracted the URL, use that as the url in the hyperlink for the bill number listed on the Armed Colorado Billwatch page. 
- Use delegation/subagents to run the process mentioned for each individual bill to extract the bill text url. 

## Completion Requirement
- Every bill title on the Armed Colorado Billwatch webpage has the official title of the bill as extracted from the archive.leg.state.co.us webpage if the bill is pre-2016. Must use delegation/sub-agents.
- Every bill title on the Armed Colorado Billwatch webpage is Title Cased. Must use delegation/sub-agents.
- Every bill number on the Armed Colorado Billwatch webpage is hyperlinked to it's text on the archive.leg.state.co.us webpage if the bill is pre-2016. Must use delegation/sub-agents.
- The entire Position column of the Billwatch page on the Armed Colorado website must be removed.
- Zero dead linked bill 

## Data sources
- https://armed-colorado.vercel.app/billwatch
- http://content.leg.colorado.gov/2015-and-prior-legislative-session-information

## Output paths
- checkpoints/, data/, docs/, node_modules/, prompts/, public/, scripts/, src/, supabase/.

## Known failure modes
- Hallucinated bill titles.
- Hallucinated bill text urls.
- Not avoiding rate limits.
- Triggering verification mechanisms.
- Not following the detaild human instructions in the "Finding the Official Bill Title of Pre-2016 Gun Bills" section and the "Creating Hyperlinks in the Armed Colorado Billwatch page for Pre-2016 Bill Text" section.
- Not properly installing and configuring thee 
- Endless model tuning without bounds.
- Reverting back to the RMGO bill titles.

## Before You Begin
- Identify every pre-2016 bill number that needs the title changes.
- Identify every pre-2016 bill number that needs to be hyperlinked to the original bill text.
- Once you have identified those bills, you may begin.
