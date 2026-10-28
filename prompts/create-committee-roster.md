# Creating Current Committee Member Rosters

## MISSION
Create an itemized roster of colorado house and colorado senate committee members, including their contact information, and a one-click email all button.

## WEBPAGE FORMAT
You will add this content to the Legislators page of the armed colorado website (https://armed-colorado.vercel.app/legislators).

The header on this page should remain the same. However, there should then exist 3 tabs on the page that display different content:
1) Find My Legislator
2) House Committees
3) Senate Committees

The first tab can take the content that already exists on armed-colorado.vercel.app/legislators and display that. 

The second tab should display every house committee in the following format:
COMMITTEE NAME
Description of committee purpose

Committee Members
Member 1 Info | Member 2 Info | Member 3 Info
Member 4 Info | Member 5 Info | Member 6 Info
.
.
.

The Member info should be formatted as follows:
[Picture] Title
          First Name Last Name
          District
          Email Address
          Phone number

The third tab should be formatted exactly the same as the second but use the information for the senate committees. 


## WEBPAGE CONTENT 
- The content to be pulled can begun to be found from https://leg.colorado.gov/committees. This lists all the house committees and the senate committees by name. We don't need to worry about the Year-Round, Interim, or Other committees.
- For a given chamber committee landing page (i.e. the House Finance committee: https://leg.colorado.gov/committees/2026A/house/Finance), there is a short description of the committee. This should be used on the armed-colorado website for the committee description. The committee name should also hyperlink to the committee webpage.
- Every committee member has their own member page (i.e. Ryan Gonzalez: https://leg.colorado.gov/legislators/ryan-gonzalez). The committee member info can be pulled from this page and should be done for every committee member, for every committee, and for each chamber (house and senate).
- You may store the member info in /home/noether/renhorne/armed-colorado/data, to include member picture and a file that contains their title, first and last name, district, email address, and phone number.


## EXAMPLE
Here is an example that shows the format and content for a single commitee. Navigating to https://leg.colorado.gov/committees, we see there is a house committee called Education. Navigating to https://leg.colorado.gov/committees/2026A/house/Education, we can obtain information to start filling in the committee page on armed-colorado:

EDUCATION (hyperlinked to https://leg.colorado.gov/committees/2026A/house/Education)
The House Education Committee considers matters concerning K-12 public schools, including public school accountability and school finance; and higher education, including administration and governance, tuition, and financial assistance.  In addition, the committee has legislative oversight responsibility for the departments of Education and Higher Education. 

[Email Every Member Button] {this button, when clicked, copies every committee members email address to the users clipboard, comma separated, so that it may be pasted into the To: field of an email. 

[Meghan Lukens picture]  Representative
                         Meghan Lukens
                         HD-26
                         meghan.lukens.house@coleg.gov 
                         303-866-2923

etc.

There shoulkdl be 3 columns of member info for every committee and the number of rows can float so that every committee member is listed.


## CHECK YOUR WORK
You have the ability to check your work by using the markdown files in /home/noether/renhorne/armed-colorado/data/committee-data. What you pull from the urls should match what is in these files in content (not necessarily format). Stick to the format listed above in WEBPAGE FORMAT.


## REFRESHING CONTENT
Every January 2nd, the committee member information, committee names, etc. should be rechecked to make sure it is not stale. Do this in the way that makes the most sense for the armed-colorado website.

