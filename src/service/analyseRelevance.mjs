const MIN_IDF = 0.1;

class Document {
    constructor(id, content) {
        this.id = id;
        this.content = content;
    }
}

class RankingResult {
    constructor(documentId, relevanceScore) {
        this.documentId = documentId;
        this.relevanceScore = parseFloat(relevanceScore.toFixed(3));
    }
}

function removeHtmlTag(text) {
    return text.replace(/<[^>]*>/g, '');
}

function getText1() {
    return `<p>Eld Ko Swee Chay</p>
<p style="text-align: center;">Looking at life with right perspectives (Ecclesiastes 6:9-12)</p>
<p><strong>Introduction</strong></p>
<p>In Ecclesiastes 6:1-8, Solomon highlighted to us the circumstances in life that lead to the evil disease of not enjoying good things in life. Riches, wealth, honour, children and long life are typical measures of prosperity and blessing used by the world, but the reality is that having those things is no guarantee that all is well with the soul. Many who have them are living a miserable life.</p>
<p>Despite life being full of “<em>vanity and vexation of spirit</em>”, as Solomon has shown before, he wants us to look at life with right perspectives: be content with what we have, contend not with God, and realise we know not the future.</p>
<p><strong>Content with what we have (Eccl 6:9)</strong></p>
<p><em><sup>9&nbsp;</sup></em><em>Better is the sight of the eyes than the wandering of the desire: this is also vanity and vexation of spirit.</em></p>
<p>“<em>The sight of the eyes</em>” is the reality before us. “<em>The wandering of the desire</em>” is the longing pursuit of unattainable things or imagined phantoms. A person longing for the unattainable and seeking the unreachable will only have the result of “<em>vanity and vexation of the spirit</em>”, i.e. meaningless, emptiness, or purposeless, never coming to a successful conclusion.</p>
<p>To “<em>see</em>” with one’s eyes signifies possession. What Solomon meant was, “It is better to have little and really enjoy it than to dream about much and never attain it.” This points to a positive perspective in life, especially when it comes to money and riches and possessions, that is contentment. Paul said: “<em>godliness with contentment is great gain</em>” (1 Tim 6:6). To be content with what is seen or possessed, a person needs to appreciate that many things in life are either unchangeable or unpredictable. There must be a willingness to accept the sovereign will of God: be content with what God has given us, don’t keep restlessly longing and seeking for more, thank God and enjoy the good things that He gives us. May this be our daily prayer: O Lord, “<em>Turn away mine eyes from beholding vanity; and quicken thou me in thy way</em>” (Psalm 119:37), that we may maintain our focus on thy holy will and purpose for our life and repress the constant “<em>wandering of the desire</em>”, the flesh-pleasing indulgence.</p>
<p><strong>Contend Not with God (Eccl 6:10)</strong></p>
<p><em><sup>10&nbsp;</sup></em><em>That which hath been is named already, and it is known that it is man: neither may he contend with him that is mightier than he.</em></p>
<p>This verse emphasises that God has predetermined all that exists and man’s destiny, the fundamental truths of life are well known and there is nothing to be added. God has foreordained everything. He has known man – what he is, what will happen to him, etc.</p>
<p>The phrase “<em>That which hath been is named already</em>” can be translated “that whatever exists has already been named” or “that everything has been known and addressed beforehand”. The phrase “<em>it is known that it is man</em>” can also be translated “it is known what man is” or “what man shall be is already known”. This means that no one will find out something that changes the basic truth of man’s life. God knows all man and all things, the past, present and future (Eccl 3:14-15; Acts 15:18).</p>
<p>Since God is omniscient and omnipotent and He foreordained everything, man is in no position to, and therefore should not, contend (strive, argue or dispute) with God his Maker, who is mightier than he. God knows what He is doing in our lives. He has a plan for us that He determined before we were born. Hence, it is useless and pointless for man to contend with God about what is foreordained. Romans 9:20 says, “<em>Nay but, O man, who art thou that repliest against God? Shall the thing formed say to him that formed it, Why hast thou made me thus?</em>” Arguing, reasoning, and complaining will bring no answers and will lead to further frustration. To contend is to add madness to folly, to submit is to give peace to the soul. It is comely for Christians to accept and submit to the authority and sovereign will of God; to be content with whatsoever state we are in (sickness or health, poverty or riches, success or failure); and to rejoice in the Lord always. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p>
<p><strong>Know Not the Future (Eccl 6:11-12)</strong></p>
<p><em><sup>11&nbsp;</sup></em><em>Seeing there be many things that increase vanity, what is man the better? <sup>12&nbsp;</sup>For who knoweth what is good for man in this life, all the days of his vain life which he spendeth as a shadow? for who can tell a man what shall be after him under the sun?</em></p>
<p>The questions asked by Solomon in these two verses are rhetorical and call for negative answers: man is not the better, man does not know what is good for him, and man cannot predict the future.</p>
<p>“<em>What is man the better?</em>” - Nothing in life is enduring. Everything is subject to change and uncertainty. Unforeseen occurrences can increase the “<em>vanity</em>,” emptiness, or purposelessness of life like losing wealth and possessions, or businesses reduced to nothing, or sicknesses, or accidents. Seeing this reality of life, Solomon asked “<em>what is man the better</em>?” Answer: there is no advantage, profit, or gain from anything that individuals may acquire or possess. Eventually, they must part with everything (Job 2:21, Eccl 5:15, 1 Tim 6:7), even if they can hold on to everything despite unforeseen occurrences.</p>
<p>“<em>Who knowth what is good for man in this life?</em>” - What we think is good may be evil, what we think is evil may be good. Only the sovereign God knows what is good for man. This “good” must be evaluated using God’s standard and must be pleasing to God. We often think we know what is good for us; but do we really know? Which is better: Wealth or poverty? Health or sickness? Fame or obscurity? Man views promotion and salary increase as good, and cancer and sickness as evil. However, if promotion and high salary lead us to carnality, spending long hours in the office and drawing us away from and serving God, it is an evil. On the other hand, if cancer and sickness cause a believer to examine his life, repent and turn back to God or a non-believer to come to the saving knowledge of God, it is good.</p>
<p>Solomon stressed the brevity of man’s life by saying “he spends his vain life like a shadow.” A shadow is ever changing and then finally disappears. Likewise, the days of life are soon spent and will come to a swift end. Only what is done for Christ will count. &nbsp;&nbsp;&nbsp;</p>
<p>“<em>who can tell a man what shall be after him under the sun?</em>” - Solomon was stating a profound truth that man does not know the future. Our future and destiny lie in the hand of a sovereign God. The inability of man to know or discern what will happen in the future is one of life’s limitations designed and ordered by God to lead man to the fear and trust of God who not only knows but also determines all the futures. &nbsp;</p>
<p><strong>Conclusion</strong></p>
<p>The longing for the unattainable and desiring the unreachable will only end in “<em>vanity and vexation of the spirit</em>”. It is better to be content with and enjoy what God has given us than to restlessly seek to satisfy the wandering desire.</p>
<p>Man is ignorant of what is good for him and of what the future holds. Man is transitory and his days are few which pass like a shadow.</p>
<p>God has a plan for us that He determined before we were born. He knows and directs everything that happens, and He is in complete and total control of our lives, and He knows what is best for our lives. It is useless and foolish for man to contend with God his Maker, who is mightier than he is and who knows the future. The best thing for man to do is to submit to the authority and sovereign will of God. AMEN.</p>`; // Your actual HTML content here
}

function getText2() {
    return `<p>Eld Ko Swee Chay</p>
<p style="text-align: center;">We take nothing with us, enjoy God’s gift with right perspective (Ecclesiastes 5:15-20)</p>
<p class="p3"><b>Introduction</b></p>
<p class="p3">Under the theme of the vanity of wealth and materialism, Ecclesiastes 5:8-14 deals with: 1) the enduring fact of oppression and injustice, 2) the love of wealth that is evil travail.</p>
<p class="p3">Continuing on the same theme, Ecclesiastes 5:15-20 deals with: 1) the reality of life – we take nothing with us, 2) the enjoyment of the gifts of God. The study of these verses will help us to have a God-centred view concerning the acquiring and hoarding of wealth and the use of the gifts of God with the right perspective.&nbsp;</p>
<p class="p3"><b>The reality of life – we take nothing with us (Eccl 5:15-17)</b></p>
<p class="p3"><i><sup>15</sup> As he came forth of his mother's womb, naked shall he return to go as he came, and shall take nothing of his labour, which he may carry away in his hand. <sup>16</sup> And this also is a sore evil, that in all points as he came, so shall he go: and what profit hath he that hath laboured for the wind? <sup>17</sup> All his days also he eateth in darkness, and he hath much sorrow and wrath with his sickness.</i></p>
<p class="p3">Eccl 5:15-16 emphasises that we come to this world with nothing, and we shall leave this world with nothing. This is a fact nobody with a sound mind can deny. Look at a baby at birth: naked, empty-handed. Look at a dead person in the coffin: holding nothing in his hands. Three other Bible verses echo the same theme as Eccl 5:15-16. “<i>And said, Naked came I out of my mother's womb, and naked shall I return thither: the LORD gave, and the LORD hath taken away; ….</i>” (Job 1:21); “<i>For when he died he shall carry nothing away ….</i>” (Ps 49:17); “<i>For we brought nothing into this world, and it is certain we can carry nothing out.</i>” (1 Tim 6:7).<span class="Apple-converted-space">&nbsp; </span>These Bible verses remind us of the reality of life: we bring nothing into this world, and we certainly can carry nothing out. We ought not to put our heart, mind, and soul in chasing the things of this world. We ought to know that we are born in sin. If we do not sorrow for our sin and come to repentance, we will die in sin and end up in hell. “<i>as he came, so shall he go</i>”, i.e. born as a sinner, die as a sinner.<span class="Apple-converted-space">&nbsp; </span>Solomon called this wasted life a sore evil and wasted effort as if he had laboured for the wind.</p>
<p class="p3">Eccl 5:17 describes such a sad life, of one who spends all his days in the endless toil, labour, and cares of this world, to live a carnal life away from God and to end up with much sorrow and wrath with sickness! Solomon wants us to ask this question: “<i>what profit hath he that hath laboured for the wind?</i>” The answer is obvious: nothing! This shows the foolishness of acquiring and hoarding wealth. Sadly, and tragically, many people amid the pursuing of career or business and of the things of the world have ignored this reality, that at death we will leave everything behind, and we will take nothing with us. <span class="Apple-converted-space">&nbsp; &nbsp;</span></p>
<p class="p3">In addition, when we are afflicted with a terminal disease, possessions and riches will mean nothing to us. This is the testimony of a rich and famous 38 year old singer who is afflicted with incurable cancer: “I own the world’s most expensive car parked in my garage, but now I only sit on a wheelchair; my house has lots of dresses and shoes but now I’m only clothed in hospital garments; I have a big bank account but<span class="Apple-converted-space">&nbsp; </span>now I only use the money to pay for medical bills; I have a beautiful house like a palace but now I lie on a hospital bed; I signed my name for thousands of my fans with great happiness but now I only sign for procedures and bills with a heavy heart; I had many hairdressers to do my hair but now I have no hair; I have a private jet to fly me anywhere but now I need people to move me to the hospital; I can have lots of good food but now I have a few white tablets as my daily food.”</p>
<p class="p3">Worse than this miserable physical and emotional agony and struggle is that if she dies as a sinner, she will end up in hell, which will be eternal torment. <span class="Apple-converted-space">&nbsp; &nbsp; &nbsp;</span></p>
<p class="p3"><b>The enjoyment of the gifts of God with the right perspective (Eccl 5:18-20)</b></p>
<p class="p3"><i><sup>18</sup> Behold that which I have seen: it is good and comely for one to eat and to drink, and to enjoy the good of all his labour that he taketh under the sun all the days of his life, which God giveth him: for it is his portion. <sup>19</sup> Every man also to whom God hath given riches and wealth, and hath given him power to eat thereof, and to take his portion, and to rejoice in his labour; this is the gift of God. <sup>20</sup> For he shall not much remember the days of his life; because God answereth him in the joy of his heart.</i></p>
<p class="p3">In Ecclesiastes 5:18-19, Solomon called our earnest attention to matters that he had experienced.<span class="Apple-converted-space">&nbsp; </span>It is good and comely (fitting, legitimate) for man to eat and to drink, and to enjoy the good of all his labour all the days of his life; for it is his portion which God gives him. God had also given every man riches, and wealth, and the power (ability) to use and enjoy them, to take his portion, and to find happiness in his labour; this is the gift of God.&nbsp;</p>
<p class="p3">This phrase “gift of God” occurs only twice in the OT – in Ecclesiastes 3:13 and 5:19. In both instances, the “gift” refers to material blessings. On the other hand, the six occurrences in the NT all refer to spiritual blessings – especially eternal life (Rom 6:23, Jn 4:10, Acts 8:20, 1Co 7:7, Eph 2:8, 2Ti 1:6).&nbsp;</p>
<p class="p3">Life is a gift of God. How long we remain in this world is determined by God (Job 14:5). All that we are and all that we have come from God. The jobs, professions, and the businesses that we do are all given by God. Wherever God places us, let us be faithful and diligent to do a good job, and not murmur and complain. Let us bear a good witness and testimony for Christ. When God blesses our labour with riches, it is legitimate and fitting for us to enjoy them but remember to thank Him for His goodness and grace. Let us also not follow how the people of the world enjoy life to the fullest with all sorts of carnal entertainment: “<i>…thou hast much goods laid up for many years; take thine ease, eat, drink and be merry.</i>” (Luke 12:19). Although riches are not the source of joy, they can be a reason for us to rejoice, since every good thing comes from God. We should focus on God the Giver rather than the gift. We can drive a nicer car, live in a bigger house, have a big bank account, but always remember: “<i>But thou shalt remember the Lord thy God: for it is he that giveth thee power to get wealth,</i>” (Deut 8:18b). We should be contented with what we have if we realise that with God, we have everything we need. <span class="Apple-converted-space">&nbsp; &nbsp;</span></p>
<p class="p3">When we enjoy the good of our labour, let us be clear that this is mere worldly happiness and temporal enjoyments. We need to carefully adjust and maintain the balance; for moderation is the key. While one might plead against over-strictness, one should also guard against wanton indulgence. Maintain a just appreciation of the gifts of God. Use these gifts prudently, not just for self and family, but also for the glory of God. Enjoying what God has given us is not evil. The evil is in the abuse of it and becoming the slave of worldly goods. Don’t allow riches to become a hindrance to our Christian life, to shut us out of heaven (Matt 19:23), to become high-minded and trust in uncertain riches (1 Tim 6:17). “<i>Labour not for the meat which perisheth, but for that meat which endureth unto everlasting life ….</i>” (Jn 6:27).</p>
<p class="p3">Despite all the potential difficulties and frustrations, God has given man the ability to use and enjoy the things of life that He gives. Ecclesiastes 5:20 sums up that the blessing is when one receives all things as gifts from God and enjoys them with a grateful and thankful heart. He will not be overly concerned with the struggles of daily life. Whatever God gives, he receives with gratitude and enjoys it for the glory of God. He passes his time pleasantly and delightfully without being troubled by the difficulties of life. A cheerful spirit is a great blessing, for it makes labours easy and afflictions light.<span class="Apple-converted-space">&nbsp; &nbsp;</span></p>
<p class="p3"><b>Conclusion</b></p>
<p class="p3">God wants us to realise that great wealth ultimately means nothing under the sun. Man comes with nothing into the world and leaves the same way. Man comes into the world as a sinner, but God doesn’t want him to leave this world as a sinner. Truly a rich man’s life without God is vanity of vanities. God wants us to know that the opportunity and ability to labour, the fruit of the labour and the power to enjoy the fruit of the labour are all gifts from God.&nbsp;</p>
<p class="p3">One major gift is the ability to enjoy work and its fruit. Enjoying what God has given is not evil; the evil is in the abuse of it and becoming a slave of worldly goods. Don’t allow riches to become a hindrance to our Christian life. God wants us to have a cheerful spirit, to live pleasantly and delightfully and not be troubled by the difficulties of life; for God has put joy and gladness in our hearts.<span class="Apple-converted-space">&nbsp; </span>Amen.</p>`; // Your actual HTML content here
}

function getText3() {
    return `<p><span style="font-size: 12pt;"><em>SATURDAY, OCTOBER 22</em><br /><strong>James 1:23-24</strong><br />Psalm 119:15-16</span></p>
<p>&nbsp;</p>
<p><span style="font-size: 12pt;"><em>“…I will not forget thy word.”</em></span></p>
<p>&nbsp;</p>
<div><span style="font-size: 12pt;"><strong>WHO IS A HEARER-ONLY?</strong></span></div>
<div>&nbsp;</div>
<div style="text-align: justify;"><span style="font-size: 12pt;">Here is an analogy of who a hearer-only person is. If a person hears&nbsp;the Word and does not do it, he is like a man who regularly looks at his&nbsp;own face in the mirror, and when he turns away from the mirror, he&nbsp;</span><span style="font-size: 12pt;">immediately forgets “<em>what manner of man</em>” (James 1:24) he is.</span></div>
<div style="text-align: justify;">&nbsp;</div>
<div style="text-align: justify;"><span style="font-size: 12pt;"><span style="text-decoration: underline;">As one beholding his face in a glass</span>: The Greek word translated “<em>beholdeth</em>”&nbsp;(James 1:24) means to endeavour by careful and patient observation to&nbsp;discover what he looks like. He stares at the mirror and considers his&nbsp;appearance, turning his face from side to side. This is the attitude a&nbsp;believer must have in searching the Scriptures. He must be a diligent&nbsp;student (2 Tim 2:15), and study the Word carefully.</span></div>
<div style="text-align: justify;">&nbsp;</div>
<div style="text-align: justify;"><span style="font-size: 12pt;"><span style="text-decoration: underline;">As one forgetting what manner he was</span>: For whatever reason, when this&nbsp;man stops observing himself in the mirror and goes away, he immediately&nbsp;forgets what he has just seen. Does this happen to you? The Spirit of God&nbsp;reveals to the believer how to apply the words of God that he has read if&nbsp;he reads diligently. But the problem is that after reading or hearing the&nbsp;Word, the hearer-only person does not do anything to apply what he has&nbsp;heard. He immediately brushes off what he has heard when he leaves.&nbsp;Thus, he is a person who claims to be a Christian but continues to live his&nbsp;old sinful life even after knowing what is right and what is wrong. He does&nbsp;not apply what he has learned from God’s Word into his life.</span></div>
<div style="text-align: justify;">&nbsp;</div>
<div style="text-align: justify;"><span style="font-size: 12pt;">Let us pray that we will not be hearers only. Although we cannot remember&nbsp;everything we hear and certainly cannot apply everything, we must not&nbsp;forget what we hear. And we have to ask the Lord to help us live out the&nbsp;words He allowed to remain in us. Let us cry with the Psalmist as he cried&nbsp;in Psalm 119:4-6. Dear reader, do you have the desire to correct your sins&nbsp;and transgressions according to what you have heard or read from God’s&nbsp;Word? Seek the help of the Holy Spirit to prick you and cause you to be a&nbsp;doer of God’s Word.</span></div>
<div style="text-align: justify;">&nbsp;</div>
<div style="text-align: justify;"><span style="font-size: 12pt;"><strong>THOUGHT:</strong> Do I have the Spirit’s conviction to be a doer?</span></div>
<div style="text-align: justify;"><span style="font-size: 12pt;"><strong>PRAYER:</strong> Father, let me be sensitive to the prompting of the Holy Spirit&nbsp;</span><span style="font-size: 12pt;">so that I will not remain a hearer only, but instead be a doer of Thy Word.</span></div>
<p>&nbsp;</p>`; // Your actual HTML content here
}

function computeTf(document, focusWords) {
    const wordCount = {};
    const loweredDocument = document.toLowerCase();

    focusWords.forEach((focusWord) => {
        const loweredFocusWord = focusWord.toLowerCase();
        const count = loweredDocument.split(loweredFocusWord).length - 1;
        wordCount[focusWord] = count;
    });

    const totalWords = loweredDocument.split(/\s+/).length;

    const tfScores = {};
    focusWords.forEach((word) => {
        tfScores[word] = wordCount[word] / totalWords || 0;
    });

    return tfScores;
}

function computeIdf(documents, focusWords) {
    const totalDocs = documents.length;
    const idfScores = {};

    focusWords.forEach((word) => {
        let containingDocs = 0;
        documents.forEach((doc) => {
            if (doc.content.toLowerCase().includes(word.toLowerCase())) {
                containingDocs++;
            }
        });
        const idf = Math.log(totalDocs / (1 + containingDocs));
        idfScores[word] = Math.max(idf, MIN_IDF);
    });

    return idfScores;
}

function computeTfIdf(tfScores, idfScores) {
    const tfIdfScores = {};

    Object.keys(tfScores).forEach((word) => {
        const tf = tfScores[word];
        const idf = idfScores[word] || MIN_IDF;
        tfIdfScores[word] = tf * idf;
    });

    return tfIdfScores;
}

function computeTfIdfVectors(documents, focusWords) {
    const idfScores = computeIdf(documents, focusWords);
    const tfIdfVectors = {};

    documents.forEach((doc) => {
        const tfScores = computeTf(doc.content, focusWords);
        const tfIdfScores = computeTfIdf(tfScores, idfScores);
        tfIdfVectors[doc.id] = tfIdfScores;
    });

    return tfIdfVectors;
}

function computeQueryTfIdfVector(focusWords) {
    const idfScores = focusWords.reduce((acc, word) => {
        acc[word] = MIN_IDF;
        return acc;
    }, {});

    const queryTfIdfVector = {};

    focusWords.forEach((word) => {
        const tf = 1.0 / focusWords.length;
        const idf = idfScores[word] || MIN_IDF;
        queryTfIdfVector[word] = tf * idf;
    });

    return queryTfIdfVector;
}

function computeCosineSimilarity(vector1, vector2) {
    let dotProduct = 0.0;
    let norm1 = 0.0;
    let norm2 = 0.0;

    Object.keys(vector1).forEach((key) => {
        const v1 = vector1[key] || 0.0;
        const v2 = vector2[key] || 0.0;
        dotProduct += v1 * v2;
        norm1 += v1 * v1;
        norm2 += v2 * v2;
    });

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    return norm1 > 0 && norm2 > 0 ? dotProduct / (norm1 * norm2) : 0.0;
}

function relevanceRanking(documents, documentTfIdfVectors, queryTfIdfVector) {
    const rankings = [];

    Object.keys(documentTfIdfVectors).forEach((docId) => {
        const docVector = documentTfIdfVectors[docId];
        const similarityScore = computeCosineSimilarity(docVector, queryTfIdfVector);
        rankings.push(new RankingResult(docId, similarityScore));
    });

    rankings.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return rankings;
}

function findDocument(documents, documentId) {
    return documents.find((doc) => doc.id == documentId) || null;
}

export async function analyseArticle(focusWords, rows){
    const documents = []
    rows.forEach((row, key) => {
        documents.push(new Document(row['id'], removeHtmlTag(row['article'])))
    })
    
    const documentTfIdfVectors = computeTfIdfVectors(documents, focusWords)
    const queryTfIdfVector = computeQueryTfIdfVector(focusWords)
    const rankingResults = relevanceRanking(documents, documentTfIdfVectors, queryTfIdfVector)

    let newResult = []
    rankingResults.forEach((result) => {
        rows.forEach((row, key) => {
                    if( row && row['id'] == result.documentId ){
                        row['relevance'] = result.relevanceScore
                        newResult.push(row)
                    }
                })
    });
    
    return newResult
}

// function main() {
//     const documents = [
//         new Document(1, removeHtmlTag(getText1())),
//         new Document(2, removeHtmlTag(getText2())),
//         new Document(3, removeHtmlTag(getText3())),
//     ];
//
//     const focusWords = [
//         'salvation', 'faith', 'theology', 'redemption', 'belief', 'doctrine',
//         'atonement', 'trust', 'religious studies', 'grace', 'spirituality',
//         'dogma', 'justification', 'confidence', 'divinity', 'repentance',
//         'conviction', 'creed',
//     ];
//
//     const documentTfIdfVectors = computeTfIdfVectors(documents, focusWords);
//     const queryTfIdfVector = computeQueryTfIdfVector(focusWords);
//     const rankingResults = relevanceRanking(documents, documentTfIdfVectors, queryTfIdfVector);
//
//     let highestScore = 0;
//     let bestDoc = null;
//     rankingResults.forEach((result) => {
//         if (result.relevanceScore > highestScore) {
//             highestScore = result.relevanceScore;
//             bestDoc = findDocument(documents, result.documentId);
//         }
//         console.log(`Document ID: ${result.documentId}, Relevance Score: ${result.relevanceScore}`);
//     });
//
//     console.log(bestDoc);
// }
//
// main();
