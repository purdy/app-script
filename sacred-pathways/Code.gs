/**
 * This function is called when the form is submitted. It will go through
 * the form responses and pull out the first name, email, and section 
 * questions. It will generate scores for each section. Then it will sort 
 * the sections by scores. Then it will email a report based on those 
 * scores.
 * 
 * @param {Object} e The event parameter created by a form
 *      submission; see
 *      https://developers.google.com/apps-script/understanding_events
 *
 */
function sacredFormReponse(e) {
  if (MailApp.getRemainingDailyQuota() > 0) {
    var form = FormApp.getActiveForm();
    var fname = 'Seeker';
    var lname = false;
    var sectionTagRegex = /\[(\w{1,})\d+\]/;
    var itemResponses = e.response.getItemResponses();
    var sectionScores = new Object();
    var sectionTags = new Array();
    for (var i = 0; i < itemResponses.length; i++) {
      var itemTitle = itemResponses[i].getItem().getTitle();
      if (itemTitle == 'Name') {
        var fullName = itemResponses[i].getResponse();
        nameRegex = /^(\w+)\s\w+$/;
        var nameMatch = fullName.match(nameRegex);
        if (nameMatch) {
          fname = nameMatch[1];
        }
        else {
          fname = fullName;
        }
      }
      var section_tag = itemTitle.match(sectionTagRegex);
      if (section_tag) {
        if (sectionScores.hasOwnProperty(section_tag[1])) {
          sectionScores[section_tag[1]].num++;
          sectionScores[section_tag[1]].total += Number(itemResponses[i].getResponse());
        }
        else {
          sectionTags.push(section_tag[1]);
          sectionScores[section_tag[1]] = { num: 1, total: Number(itemResponses[i].getResponse()) };
        }
      }
    }
    
    // Now let's score each section.
    for (sectionTag in sectionScores) {
      if (sectionScores.hasOwnProperty(sectionTag)) {
        var sectionStats = sectionScores[sectionTag];
        sectionScores[sectionTag].max_score = sectionStats.num * 5;
        sectionScores[sectionTag].score = (sectionStats.total / sectionScores[sectionTag].max_score) * 100;
      }
    }
    
    sectionTags.sort((a, b) => { return sectionScores[b].score - sectionScores[a].score; });
    
    var sectionMap = new Map();
    sectionMap.set('N', {'label': 'Naturalist', 'description': 'Naturalists would prefer to leave any building, however beautiful or austere, to pray to God beside a river. Leave the books behind, forget the demonstrations- just let them take a walk through the woods, mountains, or open meadows.'});
    sectionMap.set('S', {'label': 'Sensate', 'description': 'Sensate Christians want to be lost in the awe, beauty, and splendor of God. They are drawn particularly to the liturgical, the majestic, the grand. When these Christians worship, they want to be filled with sights, sounds, and smells that overwhelm them. Incense, intricate architecture, classical music, and formal language send their hearts soaring.'});
    sectionMap.set('T', {'label': 'Traditionalist', 'description': 'Traditionalists are fed by what are often termed the historic dimensions of faith: rituals, symbols, sacraments, and sacrifice. These Christians tend to have a disciplined life of faith. Some may be seen by others as legalists, defining their faith largely by matters of conduct. Frequently they enjoy regular attendance at church services, tithing, keeping the Sabbath, and so on.'});
    sectionMap.set('AS', {'label': 'Ascetic', 'description': 'Ascetics want nothing more than to be left alone in prayer. Take away the liturgy, the trappings of religion, the noise of the outside world. Let there be nothing to distract them - no pictures, no loud music - and leave them alone to pray in silence and simplicity.'});
    sectionMap.set('AC', {'label': 'Activist', 'description': 'Activists serve a God of justice, and their favorite Scripture is often the story of Jesus\' cleansing of the temple. They define worship as standing against evil and calling sinners to repentance. These Christians often view the church as a place to recharge their batteries so they can go back into the world to wage war against injustice.'});
    sectionMap.set('CA', {'label': 'Caregiver', 'description': 'Caregivers serve God by serving others. They often claim to see Christ in the poor and needy, and their faith is built up by interacting with other people. Such Christians may view the devotional lives of contemplatives and enthusiasts as selfish. Whereas caring for others might wear many of us down, this activity recharges a caregiver\'s batteries.'});
    sectionMap.set('E', {'label': 'Enthusiast', 'description': 'Excitement and mystery in worship is the spiritual lifeblood of enthusiasts. As sensates want to be surrounded by beauty and intellectuals love to grapple with concepts, enthusiasts are inspired by joyful celebration. These Christians are cheerleaders for God and the Christian life. Let them clap their hands, shout "Amen!" and dance in the excitement - that\'s all they ask.'});
    sectionMap.set('CO', {'label': 'Contemplative', 'description': 'Contemplatives refer to God as their lover, and images of a loving Father and Bridegroom best capture their view of God. Their favorite Bible passages may come from the Song of Songs, as they enter the "divine romance." The focus is not necessarily on serving God, doing his will, accomplishing great things in his name, or even obeying him. Rather these Christians seek to love God with the purest, deepest, and brightest love imaginable.'});
    sectionMap.set('I', {'label': 'Intellectuals', 'description': 'Intellectuals need their minds to be stirred before their hearts come truly alive. They are likely to be studying (and, in some instances, arguing either for or against) topics such as Calvinism, infant baptism, ordination of women, and predestination. These Christians live in the world of concepts.'});
    
    var emailSections = new Array();
    sectionTags.forEach(function(sectionTag) {
      var labels = {'label': 'Unknown', 'description': 'Unknown section (' + sectionTag + ')'};
      if (sectionMap.has(sectionTag)) {
        labels = sectionMap.get(sectionTag);
      }
      var section = {
        'sectionName': labels['label'],
        'score': sectionScores[sectionTag].score.toFixed(1),
        'description': labels['description']
      };
      emailSections.push(section);
    });

    var to_email = e.response.getRespondentEmail();
    var t = HtmlService.createTemplateFromFile('email.html');
    t.fname = fname;
    t.sections = emailSections;
    var message = t.evaluate();
    
    // https://developers.google.com/apps-script/reference/mail/mail-app
    MailApp.sendEmail({
      to: to_email,
      name: 'Spiritual Pathways Assessment Results',
      replyTo: 'marcus.mcclellan@apexumc.org',
      subject: 'Your ' + form.getTitle() + ' Results',
      htmlBody: message.getContent()
    });

  }
}
