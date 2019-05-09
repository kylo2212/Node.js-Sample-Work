const jiraHelpers = require("../../helpers/jira2Helpers");
const AuditDetails = require("../AuditDetails");
const auditHelpers = require("../../helpers/auditHelpers");
const cleanse = require("../cleanseAudit")

const IGNORE_AUDIT_LABELS = auditHelpers.IGNORE_AUDIT_LABELS;

/**
 * This fuction checks for the assignee of the epic/story/sub-task when it is called. 
 * @param issue The issue to be audited
 * @returns {Promise<any>} An AuditDetails object which contains the audit information for the issue.
 */
function isAssigneeIndicated(issue) {
    return new Promise(async (resolve, reject) => {
        const assigneeIndicated = new AuditDetails("Issue Assigned", issue);
        const assignee = issue.fields.assignee;
        const resolutionDate = issue.fields.resolutiondate;
  
        /* 
        * This audit was added during March of 2019 and grandfathered in with time to make updates to assignees before the March 25th date when it became 
        * mandatory to have an assignee. If an issue was already resolved before that date without an assignee the audit will still pass to reduce any backtracking
        */
        //Check assignee field is null or assigned
        if (!assignee) {
            //The resolution date is checked to see if closed before March 25, 2019 and passes if valid
            if(resolutionDate && new Date(resolutionDate) < new Date("2019-03-25")) {
                assigneeIndicated.auditPassing = true;
                assigneeIndicated.auditDetails = "The Assignee audit is passing because it was resolved and closed before March 25, 2019."
                    
                // Post the audit results to the issue
                await jiraHelpers.removeIssueAuditFailureComment(issue, assigneeIndicated);
            }
            else{
                assigneeIndicated.auditDetails = "Assignee must be indicated.";
                assigneeIndicated.auditPassing = false;

                // Post the audit results to the issue 
                await jiraHelpers.postIssueAuditFailureComment(issue, assigneeIndicated);
            }
        }
        else {
            assigneeIndicated.auditDetails = "Assignee is indicated.";
            assigneeIndicated.auditPassing = true;

            // Post the audit results to the issue
            await jiraHelpers.removeIssueAuditFailureComment(issue, assigneeIndicated);
        }
    
        return resolve(assigneeIndicated);
    })
}

/**
 * This fuction checks for the fix version of the epic/story/sub-task when it is called. 
 * @param issue The issue to be audited
 * @returns {Promise<any>} An AuditDetails object which contains the audit information for the issue.
 */
function fixVersionIndicated(issue){
    return new Promise(async (resolve, reject) => {
        const fixVersionIndicated = new AuditDetails("Fix Version Indicated", issue);
        const fixVersions = issue.fields.fixVersions;
       
        // Check to see if we should ignore this audit entirely based on the override label to ignore the fix version audit
        if(jiraHelpers.issueContainsAnyLabel(issue, [IGNORE_AUDIT_LABELS.FIX_VERSION])){
            fixVersionIndicated.auditDetails = "Fix Version Audit ignored by label";
            // Cleanse all of the sub-task comments         
            await cleanse.cleanseSubTask(issue);
            return resolve(fixVersionIndicated);
        }

        /*
        * This audit was added during April of 2019 and grandfathered in with time to make updates to fix versions before the May 6th date when it became 
        * mandatory to have a fix version indicated. It gives a span of time to get the fix versions filled in before the mandatory date. 
        */
        //Checks for the date of the audit and indicates if issue will pass or fail as is for upcoming actions in audit
        if (new Date() < new Date("2019-05-06")) {
            let passOrFail = "";
            fixVersionIndicated.auditPassing = true;

            //The audit runs if the issue is open and checks for Fix Version to alert passing/failing to correct before May 6, 2019
            passOrFail = (fixVersions && fixVersions.length === 0) ? "FAILING" : "PASSING";
    
            fixVersionIndicated.auditDetails = `This is currently ${passOrFail} the Fix Version audit. 
                Currently, this audit will auto pass no matter whether the Fix Version field is populated or not. 
                On May 6, 2019, this audit will no longer auto pass and missing Fix Version fields will trigger an audit failure.
                Fix Version Audit will be ignored with IGNORE_FIX_VERSION_AUDIT label.`;
        
            return resolve(fixVersionIndicated);
        }

        //Check if fix version field is null or populated
        if (fixVersions && fixVersions.length === 0) {
        
            fixVersionIndicated.auditDetails = "A fix version must be indicated.";
            fixVersionIndicated.auditPassing = false;

            // Post the audit results to the issue 
            await jiraHelpers.postIssueAuditFailureComment(issue, fixVersionIndicated);              
        }
        else {
            fixVersionIndicated.auditDetails = "A fix version is indicated.";
            fixVersionIndicated.auditPassing = true;

            // Post the audit results to the issue
            await jiraHelpers.removeIssueAuditFailureComment(issue, fixVersionIndicated);
        }

        return resolve(fixVersionIndicated);
    })
}

module.exports = {
    isAssigneeIndicated,
    fixVersionIndicated
};