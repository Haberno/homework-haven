import { gotScraping } from 'got-scraping'
import { Cookie, CookieJar } from 'tough-cookie'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const jar = new CookieJar()

function formatProxy(proxy) {
	let p = proxy.split(':')
	return `http://${p[2]}:${p[3]}@${p[0]}:${p[1]}`
}

function clean(jsonData) {
	let newData = { finalAnswer: { blocks: [{}] } }

	jsonData.finalAnswer?.blocks.forEach((element, index) => {
		newData.finalAnswer.blocks[index] = {
			type: element.type,
			block: element.block?.editorContentState || element.block.lines || element.block.subBlock,
		}
	})

	newData.steps = jsonData.stepByStep.steps.map((step) => ({
		id: step.id,
		blocks: [{}],
	}))

	jsonData.stepByStep.steps.forEach((step, index) => {
		newData.steps[index].id = `Step ${index + 1}`
		newData.steps[index].blocks = step.blocks.map((blocks) => ({
			type: blocks.type,
			block: blocks.block.editorContentState || blocks.block.lines || blocks.block.subBlock,
		}))
	})

	return newData
}

async function scrapeQuestion(cheggId) {
	// Question Fetch
	const question = await gotScraping.post('https://gateway.chegg.com/one-graph/graphql', {
		json: {
			operationName: 'QnaPageQuestion',
			variables: { id: cheggId },
			extensions: {
				persistedQuery: {
					version: 1,
					sha256Hash: 'b006ba35552480948479156e28e08181e41ac14ffb5a43fc0f5db4c98f22f320',
				},
			},
		},
		headers: {
			'x-chegg-referrer': 'chat',
			'apollographql-client-name': 'chegg-web',
		},
	})

	//Parsing and Logging
	const parsedQuestion = JSON.parse(question.body)
	console.dir(parsedQuestion, { depth: null })

	// if (parsedQuestion.data != null && parsedQuestion.data.questionByLegacyId != null) {
	// 	const question = parsedQuestion.data.questionByLegacyId

	// 	const questionData = await prisma.question.create({
	// 		data: {
	// 			question: question.content.body,
	// 			url: question.organicUrl,
	// 			cheggId: cheggId,
	// 			questionState: question.questionState,
	// 		},
	// 	})

	// 	console.log(questionData)
	// }
}

async function scrapeAnswer(cheggId) {
	const answer = await gotScraping.post('https://gateway.chegg.com/one-graph/graphql', {
		json: {
			operationName: 'QnaPageAnswer',
			variables: { id: cheggId },
			extensions: {
				persistedQuery: {
					version: 1,
					sha256Hash: '1c2246681ad020e019aaf2e2393e104c5db65ec57aa04a12fe563cf05fe7097f',
				},
			},
		},
		headers: {
			'x-chegg-referrer': 'chat',
			'apollographql-client-name': 'chegg-web',
		},
		cookieJar: jar,
	})

	//Parsing and Logging
	const parsedAnswer = JSON.parse(answer.body)
	console.dir(parsedAnswer, { depth: null })

	// if (parsedAnswer.data != null && parsedAnswer.data.questionByLegacyId != null) {
	// 	if (parsedAnswer.data.questionByLegacyId.displayAnswers?.__typename == 'QnaPageAnswerSub') {
	// 		const jsonData = parsedAnswer.data.questionByLegacyId.displayAnswers.sqnaAnswers.answerData[0].body.text

	// 		const rawData = clean(JSON.parse(jsonData))

	// 		const finalAnswer = JSON.stringify(rawData.finalAnswer)
	// 		const steps = JSON.stringify(rawData.steps)

	// 		const answer = await prisma.answer.create({
	// 			data: {
	// 				steps: steps,
	// 				finalAnswer: finalAnswer,
	// 				cheggId: cheggId,
	// 				question: {
	// 					connect: {
	// 						cheggId: cheggId,
	// 					},
	// 				},
	// 			},
	// 		})

	// 		console.log(answer)
	// 	}
	// }
}

jar.setCookieSync(
	new Cookie({
		key: 'id_token',
		value: `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRlYXRoZXJzbWNAZ21haWwuY29tIiwiaXNzIjoiaHViLmNoZWdnLmNvbSIsImF1ZCI6IkNIR0ciLCJpYXQiOjE3MDI2OTc4ODIsImV4cCI6MTcxODI0OTg4Miwic3ViIjoiNTY3NGIzYTYtYzllZi00YTQ1LWE3NGEtZDlmZTQ5OGI3YzQ3IiwicmVwYWNrZXJfaWQiOiJhcHciLCJjdHlwIjoiaWQiLCJpZHNpZCI6ImI5NzZjMWFjIiwiaWRzdCI6MTcwMjY5Nzg4MjY2NywiaWRzZyI6InVua25vd24ifQ.S-SmDYI-SHMUxWDuV-xtqNP7a0o-CqNg1XgOGNC2_7WTp2CKRzElMuLhWCTLDGVLKoR-Ob8KS_sh4X4dt0vwD_1yTEb0YnO9SkxupaoJ1Tshj6416XVn8R25M5oK0g_bZYswNHiOSjrLqI-XXwaXHphIjObvH2AsXQ73wfwVb_XXCpKT8gVzaOndRKfb1a1uPkfVht47uBIasmZCTfpGSWF4ObunM0rGayoJKjHqjJwDr-rabYsShok41qDyV2msGeS-t9agAc_JuoWjTs1QP94dFbjRGAKBLh025omoJuOigFNzSgfeynGWnSl_Yb3cbPcZs_LlTzZBtbwM4edHYA`,
	}),
	'https://gateway.chegg.com'
)

var id = 1

// setInterval(() => {
// 	//Every 100 Count Change the Proxy
// 	let index = 0
// 	let currentProxy = proxy[index]

// 	if (n != 100) {
// 		scrapeQuestion(id, currentProxy)
// 		n++
// 		console.log(n)
// 	} else {
// 		index++
// 		currentProxy = proxy[index]
// 		n = 0
// 	}
// 	id++
// }, 500)

setInterval(() => {
	scrapeAnswer(id)
	console.log(id)
	id++
}, 2000)
