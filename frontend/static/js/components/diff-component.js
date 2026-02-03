// DiffComponent
// Displays a side-by-side diff of two JSON objects or text strings
// Uses the Diff library (https://github.com/kpdecker/jsdiff)

class DiffComponent {
    /**
     * @param {HTMLElement} container - The container to render the diff into
     * @param {Object|String} leftValue - The left value to compare (object will be stringified)
     * @param {Object|String} rightValue - The right value to compare (object will be stringified)
     * @param {Object} options - Configuration options
     * @param {String} [options.leftLabel='Left'] - Label for the left value
     * @param {String} [options.rightLabel='Right'] - Label for the right value
     * @param {Number} [options.height=500] - Height in pixels
     */
    constructor(container, leftValue, rightValue, options = {}) {
        this.container = container;
        this.leftValue = this.normalize(leftValue);
        this.rightValue = this.normalize(rightValue);
        this.leftLabel = options.leftLabel !== undefined ? options.leftLabel : 'Left';
        this.rightLabel = options.rightLabel !== undefined ? options.rightLabel : 'Right';
        this.height = options.height !== undefined ? options.height : 500;
        this.render();
    }

    normalize(value) {
        if (value === null || value === undefined) {
            return 'null';
        }
        if (typeof value === 'object') {
            return JSON.stringify(value, null, 2);
        }
        return String(value);
    }

    render() {
        // Create wrapper div instead of modifying container
        const wrapper = document.createElement('div');
        wrapper.className = 'diff-component-container';
        this.container.appendChild(wrapper);

        // Check if values are identical
        if (this.leftValue === this.rightValue) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'diff-component-no-changes';
            messageDiv.textContent = '✓ No differences found';
            wrapper.appendChild(messageDiv);
            return;
        }

        // Create diff using the Diff library
        const diff = Diff.diffLines(this.leftValue, this.rightValue);

        // Create side-by-side layout
        const diffContainer = document.createElement('div');
        diffContainer.className = 'diff-component-side-by-side';
        diffContainer.style.height = `${this.height}px`;

        // Left side
        const leftPane = document.createElement('div');
        leftPane.className = 'diff-component-pane diff-component-left';
        const leftHeader = document.createElement('div');
        leftHeader.className = 'diff-component-header';
        leftHeader.textContent = this.leftLabel;
        leftPane.appendChild(leftHeader);
        const leftContent = document.createElement('pre');
        leftContent.className = 'diff-component-content';
        leftPane.appendChild(leftContent);

        // Right side
        const rightPane = document.createElement('div');
        rightPane.className = 'diff-component-pane diff-component-right';
        const rightHeader = document.createElement('div');
        rightHeader.className = 'diff-component-header';
        rightHeader.textContent = this.rightLabel;
        rightPane.appendChild(rightHeader);
        const rightContent = document.createElement('pre');
        rightContent.className = 'diff-component-content';
        rightPane.appendChild(rightContent);

        // Build content with highlighting
        this.buildDiffContent(diff, leftContent, rightContent);

        // Synchronize scrolling between left and right panes
        let isScrolling = false;
        leftContent.addEventListener('scroll', () => {
            if (!isScrolling) {
                isScrolling = true;
                rightContent.scrollTop = leftContent.scrollTop;
                rightContent.scrollLeft = leftContent.scrollLeft;
                setTimeout(() => { isScrolling = false; }, 10);
            }
        });
        
        rightContent.addEventListener('scroll', () => {
            if (!isScrolling) {
                isScrolling = true;
                leftContent.scrollTop = rightContent.scrollTop;
                leftContent.scrollLeft = rightContent.scrollLeft;
                setTimeout(() => { isScrolling = false; }, 10);
            }
        });

        diffContainer.appendChild(leftPane);
        diffContainer.appendChild(rightPane);
        wrapper.appendChild(diffContainer);
    }

    buildDiffContent(diff, leftContent, rightContent) {
        let leftLineNum = 1;
        let rightLineNum = 1;
        let i = 0;

        while (i < diff.length) {
            const part = diff[i];
            const lines = part.value.split('\n');
            if (lines[lines.length - 1] === '') {
                lines.pop();
            }

            // Check if this is a modification (removed followed by added)
            if (part.removed && i + 1 < diff.length && diff[i + 1].added) {
                const nextPart = diff[i + 1];
                const nextLines = nextPart.value.split('\n');
                if (nextLines[nextLines.length - 1] === '') {
                    nextLines.pop();
                }

                // Build a map of left lines by JSON key for quick lookup
                const leftLines = [...lines];
                const leftKeyMap = new Map();
                const leftLinesList = []; // For non-JSON lines
                leftLines.forEach((leftLine, leftIdx) => {
                    const leftKey = this.extractJsonKey(leftLine);
                    if (leftKey) {
                        leftKeyMap.set(leftKey, { line: leftLine, idx: leftIdx });
                    } else if (leftLine.trim()) { // Non-empty, non-JSON lines
                        leftLinesList.push({ line: leftLine, idx: leftIdx });
                    }
                });

                const leftProcessed = new Set();
                const rightLines = [...nextLines];

                // Process right lines in their original order
                rightLines.forEach((rightLine) => {
                    const rightKey = this.extractJsonKey(rightLine);
                    
                    if (rightKey && leftKeyMap.has(rightKey)) {
                        // Found a JSON key match - show character-level diff
                        const leftData = leftKeyMap.get(rightKey);
                        this.addModifiedLine(leftContent, rightContent, leftData.line, rightLine, leftLineNum++, rightLineNum++);
                        leftProcessed.add(leftData.idx);
                    } else if (!rightKey && rightLine.trim()) {
                        // Non-JSON line - try to find similar line in left
                        let bestMatch = null;
                        let bestSimilarity = 0;
                        
                        leftLinesList.forEach(leftData => {
                            if (!leftProcessed.has(leftData.idx)) {
                                const similarity = this.calculateSimilarity(leftData.line, rightLine);
                                if (similarity > bestSimilarity && similarity > 0.6) { // 60% similarity threshold
                                    bestSimilarity = similarity;
                                    bestMatch = leftData;
                                }
                            }
                        });
                        
                        if (bestMatch) {
                            // Found a similar line - show character-level diff
                            this.addModifiedLine(leftContent, rightContent, bestMatch.line, rightLine, leftLineNum++, rightLineNum++);
                            leftProcessed.add(bestMatch.idx);
                        } else {
                            // No match - this is an addition
                            this.addPlaceholderLine(leftContent);
                            this.addAddedLine(rightContent, rightLine, rightLineNum++);
                        }
                    } else {
                        // Empty line or no match - this is an addition
                        this.addPlaceholderLine(leftContent);
                        this.addAddedLine(rightContent, rightLine, rightLineNum++);
                    }
                });

                // Process unmatched left lines (removals) in their original order
                leftLines.forEach((leftLine, leftIdx) => {
                    if (!leftProcessed.has(leftIdx)) {
                        this.addRemovedLine(leftContent, leftLine, leftLineNum++);
                        this.addPlaceholderLine(rightContent);
                    }
                });

                i += 2; // Skip both parts
            } else if (part.removed) {
                // Pure removal
                lines.forEach(line => {
                    this.addRemovedLine(leftContent, line, leftLineNum++);
                    this.addPlaceholderLine(rightContent);
                });
                i++;
            } else if (part.added) {
                // Pure addition
                lines.forEach(line => {
                    this.addPlaceholderLine(leftContent);
                    this.addAddedLine(rightContent, line, rightLineNum++);
                });
                i++;
            } else {
                // Unchanged
                lines.forEach(line => {
                    this.addUnchangedLine(leftContent, line, leftLineNum++);
                    this.addUnchangedLine(rightContent, line, rightLineNum++);
                });
                i++;
            }
        }
    }

    // Extract JSON key from a line like '  "key": value,'
    extractJsonKey(line) {
        const match = line.match(/^\s*"([^"]+)":/);
        return match ? match[1] : null;
    }

    // Calculate similarity between two strings (0 to 1)
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        // Count matching characters in order
        let matches = 0;
        let shorterIdx = 0;
        
        for (let i = 0; i < longer.length && shorterIdx < shorter.length; i++) {
            if (longer[i] === shorter[shorterIdx]) {
                matches++;
                shorterIdx++;
            }
        }
        
        return matches / longer.length;
    }

    addModifiedLine(leftContent, rightContent, leftLine, rightLine, leftLineNum, rightLineNum) {
        // Get character-level diff
        const charDiff = Diff.diffChars(leftLine, rightLine);

        // Calculate the percentage of change
        const totalLength = Math.max(leftLine.length, rightLine.length);
        let changedLength = 0;
        charDiff.forEach(part => {
            if (part.added || part.removed) {
                changedLength += part.value.length;
            }
        });
        const changePercentage = changedLength / totalLength;
        
        // Only use yellow background if change is substantial (>20% of line)
        const modifiedClass = changePercentage > 0.2 ? 'diff-component-modified' : '';

        // Left side (removed/modified)
        const leftLineDiv = document.createElement('div');
        leftLineDiv.className = `diff-component-line ${modifiedClass}`;
        const leftLineNumSpan = document.createElement('span');
        leftLineNumSpan.className = 'diff-component-line-number';
        leftLineNumSpan.textContent = leftLineNum;
        leftLineDiv.appendChild(leftLineNumSpan);
        
        const leftLineTextSpan = document.createElement('span');
        leftLineTextSpan.className = 'diff-component-line-text';
        charDiff.forEach(part => {
            if (part.removed) {
                const span = document.createElement('span');
                span.className = 'diff-component-char-removed';
                span.textContent = part.value;
                leftLineTextSpan.appendChild(span);
            } else if (!part.added) {
                leftLineTextSpan.appendChild(document.createTextNode(part.value));
            }
        });
        leftLineDiv.appendChild(leftLineTextSpan);
        leftContent.appendChild(leftLineDiv);

        // Right side (added/modified)
        const rightLineDiv = document.createElement('div');
        rightLineDiv.className = `diff-component-line ${modifiedClass}`;
        const rightLineNumSpan = document.createElement('span');
        rightLineNumSpan.className = 'diff-component-line-number';
        rightLineNumSpan.textContent = rightLineNum;
        rightLineDiv.appendChild(rightLineNumSpan);
        
        const rightLineTextSpan = document.createElement('span');
        rightLineTextSpan.className = 'diff-component-line-text';
        charDiff.forEach(part => {
            if (part.added) {
                const span = document.createElement('span');
                span.className = 'diff-component-char-added';
                span.textContent = part.value;
                rightLineTextSpan.appendChild(span);
            } else if (!part.removed) {
                rightLineTextSpan.appendChild(document.createTextNode(part.value));
            }
        });
        rightLineDiv.appendChild(rightLineTextSpan);
        rightContent.appendChild(rightLineDiv);
    }

    addRemovedLine(content, line, lineNum) {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'diff-component-line diff-component-removed';
        const lineNumSpan = document.createElement('span');
        lineNumSpan.className = 'diff-component-line-number';
        lineNumSpan.textContent = lineNum;
        const lineTextSpan = document.createElement('span');
        lineTextSpan.className = 'diff-component-line-text';
        lineTextSpan.textContent = line || ' ';
        lineDiv.appendChild(lineNumSpan);
        lineDiv.appendChild(lineTextSpan);
        content.appendChild(lineDiv);
    }

    addAddedLine(content, line, lineNum) {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'diff-component-line diff-component-added';
        const lineNumSpan = document.createElement('span');
        lineNumSpan.className = 'diff-component-line-number';
        lineNumSpan.textContent = lineNum;
        const lineTextSpan = document.createElement('span');
        lineTextSpan.className = 'diff-component-line-text';
        lineTextSpan.textContent = line || ' ';
        lineDiv.appendChild(lineNumSpan);
        lineDiv.appendChild(lineTextSpan);
        content.appendChild(lineDiv);
    }

    addUnchangedLine(content, line, lineNum) {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'diff-component-line';
        const lineNumSpan = document.createElement('span');
        lineNumSpan.className = 'diff-component-line-number';
        lineNumSpan.textContent = lineNum;
        const lineTextSpan = document.createElement('span');
        lineTextSpan.className = 'diff-component-line-text';
        lineTextSpan.textContent = line || ' ';
        lineDiv.appendChild(lineNumSpan);
        lineDiv.appendChild(lineTextSpan);
        content.appendChild(lineDiv);
    }

    addPlaceholderLine(content) {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'diff-component-line diff-component-placeholder';
        const lineNumSpan = document.createElement('span');
        lineNumSpan.className = 'diff-component-line-number';
        lineNumSpan.textContent = '';
        const lineTextSpan = document.createElement('span');
        lineTextSpan.className = 'diff-component-line-text';
        lineTextSpan.textContent = ' ';
        lineDiv.appendChild(lineNumSpan);
        lineDiv.appendChild(lineTextSpan);
        content.appendChild(lineDiv);
    }
}

// Export to window
window.DiffComponent = DiffComponent;
