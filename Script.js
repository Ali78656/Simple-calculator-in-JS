const CONSTANTS = {
  pi: 3.1415,
  e: 2.7182,
};

const OPERATORS = {
  "+": { precedence: 1, assoc: "L", fn: (a, b) => a + b },
  "-": { precedence: 1, assoc: "L", fn: (a, b) => a - b },
  "*": { precedence: 2, assoc: "L", fn: (a, b) => a * b },
  "/": {
    precedence: 2,
    assoc: "L",
    fn: (a, b) => {
      if (b === 0) {
        throw new Error("Division by zero is not allowed.");
      }
      return a / b;
    },
  },
  "^": { precedence: 3, assoc: "R", fn: (a, b) => Math.pow(a, b) },
};

const FUNCTIONS = {
  sqrt: (value) => {
    if (value < 0) {
      throw new Error("Square root requires a non-negative number.");
    }
    return Math.sqrt(value);
  },
  sin: (value) => Math.sin(value),
  cos: (value) => Math.cos(value),
  tan: (value) => {
    const result = Math.tan(value);
    if (!Number.isFinite(result)) {
      throw new Error("Tangent is undefined for this angle.");
    }
    return result;
  },
};

document.addEventListener("DOMContentLoaded", () => {
  const expressionInput = document.querySelector("#expressionInput");
  const resultDisplay = document.querySelector("#resultDisplay");
  const keypad = document.querySelector("#keypad");
  const evaluateButton = document.querySelector("#evaluateExpression");
  const clearButton = document.querySelector("#clearExpression");
  const historyList = document.querySelector("#historyList");
  const variableForm = document.querySelector("#variableForm");
  const variableNameInput = document.querySelector("#variableName");
  const variableValueInput = document.querySelector("#variableValue");
  const variableList = document.querySelector("#variableList");

  const state = {
    variables: {},
    history: [],
  };

  const showResult = (message, isError = false) => {
    resultDisplay.textContent = message;
    resultDisplay.classList.toggle("error", isError);
  };

  const insertAtCursor = (value) => {
    const { selectionStart, selectionEnd } = expressionInput;
    const currentValue = expressionInput.value;
    const nextValue =
      currentValue.slice(0, selectionStart) +
      value +
      currentValue.slice(selectionEnd);

    expressionInput.value = nextValue;
    const caret = selectionStart + value.length;
    expressionInput.setSelectionRange(caret, caret);
    expressionInput.focus();
  };

  const isUnaryMinus = (char, tokens) => {
    if (char !== "-") return false;
    if (tokens.length === 0) return true;
    const prev = tokens[tokens.length - 1];
    return (
      prev.type === "operator" ||
      (prev.type === "paren" && prev.value === "(") ||
      prev.type === "function"
    );
  };

  const tokenize = (expression) => {
    const tokens = [];
    let i = 0;
    while (i < expression.length) {
      const char = expression[i];

      if (/\s/.test(char)) {
        i += 1;
        continue;
      }

      if (/[0-9.]/.test(char)) {
        let number = char;
        let dotCount = char === "." ? 1 : 0;
        while (i + 1 < expression.length) {
          const next = expression[i + 1];
          if (next === ".") {
            if (dotCount > 0) break;
            dotCount += 1;
            number += next;
            i += 1;
            continue;
          }
          if (/[0-9]/.test(next)) {
            number += next;
            i += 1;
            continue;
          }
          break;
        }
        if (number === ".") {
          throw new Error("Invalid number format.");
        }
        tokens.push({ type: "number", value: Number(number) });
        i += 1;
        continue;
      }

      if (/[a-z]/i.test(char)) {
        let identifier = char;
        while (i + 1 < expression.length) {
          const next = expression[i + 1];
          if (/[a-z0-9_]/i.test(next)) {
            identifier += next;
            i += 1;
            continue;
          }
          break;
        }
        const lowered = identifier.toLowerCase();
        if (FUNCTIONS[lowered]) {
          tokens.push({ type: "function", value: lowered });
        } else {
          tokens.push({ type: "identifier", value: lowered });
        }
        i += 1;
        continue;
      }

      if ("+-*/^".includes(char)) {
        if (isUnaryMinus(char, tokens)) {
          tokens.push({ type: "number", value: 0 });
        }
        tokens.push({ type: "operator", value: char });
        i += 1;
        continue;
      }

      if (char === "(" || char === ")") {
        tokens.push({ type: "paren", value: char });
        i += 1;
        continue;
      }

      throw new Error(`Unsupported character "${char}".`);
    }
    return tokens;
  };

  const toRpn = (tokens) => {
    const output = [];
    const stack = [];

    tokens.forEach((token) => {
      if (token.type === "number" || token.type === "identifier") {
        output.push(token);
        return;
      }

      if (token.type === "function") {
        stack.push(token);
        return;
      }

      if (token.type === "operator") {
        const currentOp = token.value;
        while (stack.length) {
          const top = stack[stack.length - 1];
          if (top.type !== "operator") break;

          const topOp = top.value;
          const shouldPop =
            OPERATORS[topOp].precedence > OPERATORS[currentOp].precedence ||
            (OPERATORS[topOp].precedence === OPERATORS[currentOp].precedence &&
              OPERATORS[currentOp].assoc === "L");

          if (!shouldPop) break;
          output.push(stack.pop());
        }
        stack.push(token);
        return;
      }

      if (token.type === "paren" && token.value === "(") {
        stack.push(token);
        return;
      }

      if (token.type === "paren" && token.value === ")") {
        let foundLeftParen = false;
        while (stack.length) {
          const top = stack.pop();
          if (top.type === "paren" && top.value === "(") {
            foundLeftParen = true;
            break;
          }
          output.push(top);
        }
        if (!foundLeftParen) {
          throw new Error("Mismatched parentheses.");
        }
        if (stack.length && stack[stack.length - 1].type === "function") {
          output.push(stack.pop());
        }
      }
    });

    while (stack.length) {
      const top = stack.pop();
      if (top.type === "paren") {
        throw new Error("Mismatched parentheses.");
      }
      output.push(top);
    }

    return output;
  };

  const evaluateRpn = (rpnTokens, scope) => {
    const stack = [];

    rpnTokens.forEach((token) => {
      if (token.type === "number") {
        stack.push(token.value);
        return;
      }

      if (token.type === "identifier") {
        if (scope.hasOwnProperty(token.value)) {
          stack.push(scope[token.value]);
          return;
        }
        throw new Error(`Unknown variable or constant "${token.value}".`);
      }

      if (token.type === "function") {
        if (stack.length < 1) {
          throw new Error("Incomplete expression: missing argument.");
        }
        const value = stack.pop();
        const result = FUNCTIONS[token.value](value);
        if (!Number.isFinite(result) || Number.isNaN(result)) {
          throw new Error("Invalid function result.");
        }
        stack.push(result);
        return;
      }

      if (token.type === "operator") {
        if (stack.length < 2) {
          throw new Error("Incomplete expression: missing values.");
        }
        const right = stack.pop();
        const left = stack.pop();
        const result = OPERATORS[token.value].fn(left, right);
        if (!Number.isFinite(result) || Number.isNaN(result)) {
          throw new Error("Invalid mathematical result.");
        }
        stack.push(result);
      }
    });

    if (stack.length !== 1) {
      throw new Error("Incomplete expression.");
    }

    return stack[0];
  };

  const evaluateExpression = () => {
    const rawExpression = expressionInput.value.trim();
    if (!rawExpression) {
      showResult("Please enter an expression first.", true);
      return;
    }

    try {
      const tokens = tokenize(rawExpression);
      const rpn = toRpn(tokens);
      const scope = { ...CONSTANTS, ...state.variables };
      const value = evaluateRpn(rpn, scope);
      const formatted = Number(value).toFixed(4);
      showResult(`Result: ${formatted}`);
      addHistoryItem(rawExpression, formatted);
    } catch (error) {
      showResult(error.message, true);
    }
  };

  const addHistoryItem = (expression, result) => {
    state.history.unshift({ expression, result });
    renderHistory();
  };

  const renderHistory = () => {
    historyList.innerHTML = "";
    if (state.history.length === 0) {
      historyList.innerHTML = '<li class="placeholder">No history yet.</li>';
      return;
    }

    state.history.forEach((item, index) => {
      const li = document.createElement("li");
      li.classList.add("history-item");

      const content = document.createElement("div");
      content.classList.add("history-item__content");
      content.textContent = `${item.expression} = ${item.result}`;
      content.title = "Click to load expression";
      content.addEventListener("click", () => {
        expressionInput.value = item.expression;
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => {
        state.history.splice(index, 1);
        renderHistory();
      });

      li.append(content, deleteBtn);
      historyList.appendChild(li);
    });
  };

  const renderVariables = () => {
    variableList.innerHTML = "";
    const entries = Object.entries(state.variables);
    if (entries.length === 0) {
      variableList.innerHTML =
        '<li class="placeholder">No variables added yet.</li>';
      return;
    }

    entries.forEach(([name, value]) => {
      const li = document.createElement("li");
      li.classList.add("variable-item");
      li.textContent = `${name} = ${value}`;

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", () => {
        delete state.variables[name];
        renderVariables();
      });

      li.appendChild(removeBtn);
      variableList.appendChild(li);
    });
  };

  const handleVariableSubmit = (event) => {
    event.preventDefault();
    const name = variableNameInput.value.trim().toLowerCase();
    const value = variableValueInput.value.trim();

    if (!name || !value) {
      showResult("Enter both variable name and value.", true);
      return;
    }

    if (!/^[a-z][a-z0-9_]*$/i.test(name)) {
      showResult(
        "Variable names must start with a letter and contain only letters, numbers, or underscores.",
        true
      );
      return;
    }

    if (CONSTANTS.hasOwnProperty(name)) {
      showResult("Cannot override built-in constants (pi, e).", true);
      return;
    }

    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      showResult("Variable value must be a valid number.", true);
      return;
    }

    state.variables[name] = numericValue;
    renderVariables();
    variableForm.reset();
    showResult(`Variable "${name}" saved.`, false);
  };

  const handleKeypadClick = (event) => {
    const { target } = event;
    if (!(target instanceof HTMLButtonElement)) return;

    const action = target.dataset.action;
    if (action === "backspace") {
      const { selectionStart, selectionEnd, value } = expressionInput;
      if (selectionStart === selectionEnd && selectionStart > 0) {
        const nextValue =
          value.slice(0, selectionStart - 1) + value.slice(selectionEnd);
        expressionInput.value = nextValue;
        const caret = selectionStart - 1;
        expressionInput.setSelectionRange(caret, caret);
      } else if (selectionStart !== selectionEnd) {
        const nextValue =
          value.slice(0, selectionStart) + value.slice(selectionEnd);
        expressionInput.value = nextValue;
        expressionInput.setSelectionRange(selectionStart, selectionStart);
      }
      expressionInput.focus();
      return;
    }

    const value = target.dataset.value;
    if (typeof value === "string") {
      insertAtCursor(value);
    }
  };

  keypad.addEventListener("click", handleKeypadClick);
  evaluateButton.addEventListener("click", evaluateExpression);
  clearButton.addEventListener("click", () => {
    expressionInput.value = "";
    showResult("Expression cleared.");
  });
  expressionInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      evaluateExpression();
    }
  });

  // Copy-to-clipboard feature removed — clicking the result no longer copies text.
  variableForm.addEventListener("submit", handleVariableSubmit);

  renderVariables();
  renderHistory();
});
