// @ts-check (uses JSDoc types for type checking)

import inlineAutoformatEditing from '@ckeditor/ckeditor5-autoformat/src/inlineautoformatediting';
import { Editor } from '@ckeditor/ckeditor5-core';
import Element from '@ckeditor/ckeditor5-engine/src/model/element';
import Text from '@ckeditor/ckeditor5-engine/src/model/text';
import TextProxy from '@ckeditor/ckeditor5-engine/src/model/textproxy';
import Range from '@ckeditor/ckeditor5-engine/src/view/range';
import { modelQueryElement, modelQueryElementsAll } from '../utils';
import { COMMANDS, ELEMENTS } from '../constants';

/**
 * Adds functionality to support creating footnotes using markdown syntax, e.g. `[^1]`.
 * @param {Editor} editor 
 * @param {Element} rootElement 
 */
export const addFootnoteAutoformatting = (editor, rootElement) => {
	if(editor.plugins.has('Autoformat')) {
		const autoformatPluginInstance = editor.plugins.get('Autoformat');
		inlineAutoformatEditing(editor, autoformatPluginInstance, 
			text => regexMatchCallback(editor, text), 
			// @ts-ignore Pretty sure definitely typed is wrong
			(_, /**@type Range[]*/ ranges) => formatCallback(ranges, editor, rootElement)
			);
	}
}

/**
 * CKEditor's autoformatting feature (basically find and replace) has two opinionated default modes:
 * block autoformatting, which replaces the entire line, and inline autoformatting,
 * which expects a section to be formatted (but, importantly not removed) surrounded by 
 * a pair of delimters which get removed. 
 * 
 * Neither of those are ideal for this case. We want to replace the matched text with a new element, 
 * without deleting the entire line.
 * 
 * However, inlineAutoformatEditing allows for passing in a custom callback to handle
 * regex matching, which also allows us to specify which sections to remove and
 * which sections pass on to the formatting callback. This method removes the entire
 * matched text, while passing the range of the numeric text on to the formatting callback.
 * 
 * If 0 or more than 1 match is found, it returns empty ranges for both format and remove. 
 * 
 * @param {Editor} editor
 * @param {string} text 
 * @returns {{remove: [number, number][], format: [number, number][]}}
 */
const regexMatchCallback = (editor, text) => {
	const selectionStart = editor.model.document.selection.anchor;
	// get the text node containing the cursor's position, or the one ending at `the cursor's position
	const surroundingText = selectionStart && (selectionStart.textNode || selectionStart.getShiftedBy(-1).textNode);
	
	if(!selectionStart || !surroundingText){
		return {
			remove: [],
			format: [],
		}
	} 

	const results = text.matchAll(/\[\^([0-9]+)\]/g);

	for (const result of results || []) {
		const removeStartIndex = text.indexOf(result[0])
		const removeEndIndex = removeStartIndex + result[0].length;
		const textNodeOffset = selectionStart.parent.getChildStartOffset(surroundingText);

		// if the cursor isn't at the end of the range to be replaced, do nothing
		if(textNodeOffset === null || selectionStart.offset !== textNodeOffset + removeEndIndex) {
			continue;
		}
		const formatStartIndex = removeStartIndex + 2;
		const formatEndIndex = formatStartIndex + result[1].length;
		return {
			remove: [[removeStartIndex, removeEndIndex]],
			format: [[formatStartIndex, formatEndIndex]],
		}
	}
	return {
		remove: [],
		format: [],
	}
}

/**
 * This callback takes in a range of text passed on by regexMatchCallback,
 * and attempts to insert a corresponding footnote reference at the current location.
 * 
 * Footnotes only get inserted if the matching range is an integer between 1 
 * and the number of existing footnotes + 1.
 * 
 * @param {Range[]} ranges 
 * @param {Editor} editor 
 * @param {Element} rootElement 
 * @returns {boolean|void} 
 */
const formatCallback = (ranges, editor, rootElement) => {
	const command = editor.commands.get(COMMANDS.insertFootnote);
	if(!command || !command.isEnabled) {
		return;
	}
	const text = [...ranges[0].getItems()][0];
	if(!(text instanceof TextProxy || text instanceof Text)) {
		return false;
	}
	const match = text.data.match(/[0-9]+/);
	if(!match) {
		return false;
	}
	const footnoteId = parseInt(match[0]);
	const footnoteSection = modelQueryElement(editor, rootElement, element => element.name === ELEMENTS.footnoteSection);
	if(!footnoteSection) {
		if(footnoteId !== 1) {
			return false;
		}
		editor.execute(COMMANDS.insertFootnote, { footnoteId: 0 });
		return;
	}
	const footnoteCount = modelQueryElementsAll(editor, footnoteSection, element =>  element.name === ELEMENTS.footnoteLabel).length;
	if(footnoteId === footnoteCount + 1) {
		editor.execute(COMMANDS.insertFootnote, { footnoteId: 0 });
		return;
	}
	else if(footnoteId >= 1 && footnoteId <= footnoteCount) {
		editor.execute(COMMANDS.insertFootnote, { footnoteId: footnoteId })
		return;
	}
	return false;
}
