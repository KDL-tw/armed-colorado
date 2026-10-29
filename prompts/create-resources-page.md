# Update Resources Page

## MISSION
Update the Resources webpage of the armed colorado website to include new categories, better organization descriptions, hyperlinks, and information.

## CREATE ORGANIZATION LIST
Take the organization names and links to the organizations on https://armed-colorado.vercel.app/resources and perform the following:
- Extract the current links already on webpage. Remove header they are under. 
- Add the organizations in data/tmp-orgs.md to that list and deduplicate.
- Sort the organizations into well defined but broad categories and use those as the headers to categorize them under.
- Write this list out to a file called orgs.md in /home/noether/renhorne/armed-colorado/data.

## RECREATE WEBPAGE
Recreate the https://armed-colorado.vercel.app/resources webpage in the following manner:
- Keep the categories and organizations as they were descovered in the work above.
- If it makes sense, the format should be Full-Name-of-Organization (Shortened Name) for each organization under each category. For instance, Gun Owners of America should look like "Gun Owners of America (GOA)".
- For each organization:
	- Include a 2 sentence description of the organization. Include what they specialize in.
	- Hyperlink the url to the organization's webpage to the title of the organization on the armed colorado website.
	- Ensure the url to the organization website is correct.
	- Go to their official website and look for a representative to contact in the state of Colorado. If the organization does not have a representative or contact for Colorado, in bold red lettering put "[NO COLORADO CONTACT]" next to the organizations name. If they do have a colorado contact, add that contact information at the end of the organization description.
