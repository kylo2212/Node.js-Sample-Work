# Node.js-Sample-work
A couple Node.js functions written for a bigger project

This is one file I wrote with a couple functions used in an auditing program at my work. I have permission to share this file as an example of my work. 

The functions check the information in a Jira project management software program by issue and checks for certain things. 

The isAssigneeIndicated function checks to ensure an assignee was input for any issue that needs work. It fails the audit if not filled in. 

The fixVersionIndicated function checks to make sure there is information for the fix version of the epic, story and defect levels of an issue in Jira. It fails the audit if not filled in. 
