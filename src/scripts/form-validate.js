// -----------------------------------------
// FORM VALIDATION — Live validation with spam protection
// -----------------------------------------
// Attributes:
//   [data-form-validate]        — form wrapper
//   [data-validate]             — field group (wraps input/textarea/select)
//   [data-submit]               — submit button wrapper (contains hidden input[type="submit"])
//   [data-radiocheck-group]     — group of radio/checkbox inputs (uses min/max attrs)
//
// Classes applied to [data-validate] field groups:
//   .is--filled    — field has a value
//   .is--success   — field passes validation
//   .is--error     — field fails validation (only after interaction)

let cleanups = [];

function setupForm(formContainer) {
  var startTime = new Date().getTime();
  var form = formContainer.querySelector('form');
  if (!form) return null;

  var validateFields = form.querySelectorAll('[data-validate]');
  var dataSubmit = form.querySelector('[data-submit]');
  if (!dataSubmit) return null;

  var realSubmitInput = dataSubmit.querySelector('input[type="submit"]');
  if (!realSubmitInput) return null;

  var listeners = [];

  function addListener(el, type, handler) {
    el.addEventListener(type, handler);
    listeners.push({ el: el, type: type, handler: handler });
  }

  function isSpam() {
    return new Date().getTime() - startTime < 5000;
  }

  // Disable select options with invalid values
  validateFields.forEach(function (fieldGroup) {
    var select = fieldGroup.querySelector('select');
    if (select) {
      var options = select.querySelectorAll('option');
      options.forEach(function (option) {
        if (
          option.value === '' ||
          option.value === 'disabled' ||
          option.value === 'null' ||
          option.value === 'false'
        ) {
          option.setAttribute('disabled', 'disabled');
        }
      });
    }
  });

  function isValid(fieldGroup) {
    var radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');

    if (radioCheckGroup) {
      var inputs = radioCheckGroup.querySelectorAll('input[type="radio"], input[type="checkbox"]');
      var checkedCount = radioCheckGroup.querySelectorAll('input:checked').length;
      var min = parseInt(radioCheckGroup.getAttribute('min')) || 1;
      var max = parseInt(radioCheckGroup.getAttribute('max')) || inputs.length;

      if (inputs[0].type === 'radio') return checkedCount >= 1;
      if (inputs.length === 1) return inputs[0].checked;
      return checkedCount >= min && checkedCount <= max;
    }

    var input = fieldGroup.querySelector('input, textarea, select');
    if (!input) return false;

    var value = input.value.trim();
    var length = value.length;
    var min = parseInt(input.getAttribute('min')) || 0;
    var max = parseInt(input.getAttribute('max')) || Infinity;

    if (input.tagName.toLowerCase() === 'select') {
      return value !== '' && value !== 'disabled' && value !== 'null' && value !== 'false';
    }

    if (input.type === 'email') {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    var valid = true;
    if (input.hasAttribute('min') && length < min) valid = false;
    if (input.hasAttribute('max') && length > max) valid = false;
    return valid;
  }

  function updateFieldStatus(fieldGroup) {
    var radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');

    if (radioCheckGroup) {
      var inputs = radioCheckGroup.querySelectorAll('input[type="radio"], input[type="checkbox"]');
      var checkedCount = radioCheckGroup.querySelectorAll('input:checked').length;

      if (checkedCount > 0) {
        fieldGroup.classList.add('is--filled');
      } else {
        fieldGroup.classList.remove('is--filled');
      }

      if (isValid(fieldGroup)) {
        fieldGroup.classList.add('is--success');
        fieldGroup.classList.remove('is--error');
      } else {
        fieldGroup.classList.remove('is--success');
        var anyStarted = Array.from(inputs).some(function (input) { return input.__validationStarted; });
        if (anyStarted) {
          fieldGroup.classList.add('is--error');
        } else {
          fieldGroup.classList.remove('is--error');
        }
      }
    } else {
      var input = fieldGroup.querySelector('input, textarea, select');
      if (!input) return;

      if (input.value.trim()) {
        fieldGroup.classList.add('is--filled');
      } else {
        fieldGroup.classList.remove('is--filled');
      }

      if (isValid(fieldGroup)) {
        fieldGroup.classList.add('is--success');
        fieldGroup.classList.remove('is--error');
      } else {
        fieldGroup.classList.remove('is--success');
        if (input.__validationStarted) {
          fieldGroup.classList.add('is--error');
        } else {
          fieldGroup.classList.remove('is--error');
        }
      }
    }
  }

  function validateAndStartAll() {
    var allValid = true;
    var firstInvalid = null;

    validateFields.forEach(function (fieldGroup) {
      var input = fieldGroup.querySelector('input, textarea, select');
      var radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');

      if (input) input.__validationStarted = true;
      if (radioCheckGroup) {
        radioCheckGroup.__validationStarted = true;
        radioCheckGroup.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(function (inp) {
          inp.__validationStarted = true;
        });
      }

      updateFieldStatus(fieldGroup);

      if (!isValid(fieldGroup)) {
        allValid = false;
        if (!firstInvalid) firstInvalid = input || radioCheckGroup.querySelector('input');
      }
    });

    if (!allValid && firstInvalid) firstInvalid.focus();
    return allValid;
  }

  function handleSubmit() {
    if (validateAndStartAll()) {
      if (isSpam()) {
        alert('Form submitted too quickly. Please try again.');
        return;
      }
      realSubmitInput.click();

      // After Webflow submits, poll for .w-form-done visibility then redirect
      if (redirectUrl) {
        var attempts = 0;
        var pollId = setInterval(function () {
          var done = formContainer.querySelector('.w-form-done');
          if (done && done.offsetParent !== null) {
            clearInterval(pollId);
            window.location.href = redirectUrl;
          }
          if (++attempts > 50) clearInterval(pollId); // bail after ~5s
        }, 100);
      }
    }
  }

  // Bind live validation per field
  validateFields.forEach(function (fieldGroup) {
    var input = fieldGroup.querySelector('input, textarea, select');
    var radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');

    if (radioCheckGroup) {
      var inputs = radioCheckGroup.querySelectorAll('input[type="radio"], input[type="checkbox"]');
      inputs.forEach(function (inp) {
        inp.__validationStarted = false;

        addListener(inp, 'change', function () {
          requestAnimationFrame(function () {
            if (!inp.__validationStarted) {
              var checkedCount = radioCheckGroup.querySelectorAll('input:checked').length;
              var min = parseInt(radioCheckGroup.getAttribute('min')) || 1;
              if (checkedCount >= min) inp.__validationStarted = true;
            }
            if (inp.__validationStarted) updateFieldStatus(fieldGroup);
          });
        });

        addListener(inp, 'blur', function () {
          inp.__validationStarted = true;
          updateFieldStatus(fieldGroup);
        });
      });
    } else if (input) {
      input.__validationStarted = false;

      if (input.tagName.toLowerCase() === 'select') {
        addListener(input, 'change', function () {
          input.__validationStarted = true;
          updateFieldStatus(fieldGroup);
        });
      } else {
        addListener(input, 'input', function () {
          var value = input.value.trim();
          var length = value.length;
          var min = parseInt(input.getAttribute('min')) || 0;
          var max = parseInt(input.getAttribute('max')) || Infinity;

          if (!input.__validationStarted) {
            if (input.type === 'email') {
              if (isValid(fieldGroup)) input.__validationStarted = true;
            } else {
              if (
                (input.hasAttribute('min') && length >= min) ||
                (input.hasAttribute('max') && length <= max)
              ) {
                input.__validationStarted = true;
              }
            }
          }

          if (input.__validationStarted) updateFieldStatus(fieldGroup);
        });

        addListener(input, 'blur', function () {
          input.__validationStarted = true;
          updateFieldStatus(fieldGroup);
        });
      }
    }
  });

  // Dynamic redirect — poll for Webflow's .w-form-done after submit
  var redirectPrefix = form.getAttribute('data-form-redirect-prefix') || '';
  var redirectSlug = form.getAttribute('data-form-redirect') || '';
  var redirectUrl = null;
  if (redirectSlug) {
    if (redirectSlug.indexOf('http') === 0) {
      redirectUrl = redirectSlug;
    } else {
      // Build path: /prefix/slug
      var parts = [redirectPrefix, redirectSlug].filter(Boolean).map(function (p) {
        return p.replace(/^\/|\/$/g, '');
      });
      redirectUrl = '/' + parts.join('/');
    }
  }

  // Submit handlers
  addListener(dataSubmit, 'click', handleSubmit);

  addListener(form, 'keydown', function (event) {
    if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') {
      event.preventDefault();
      handleSubmit();
    }
  });

  return function destroy() {
    listeners.forEach(function (l) { l.el.removeEventListener(l.type, l.handler); });
    listeners = [];
    validateFields.forEach(function (fieldGroup) {
      fieldGroup.classList.remove('is--filled', 'is--success', 'is--error');
      var inputs = fieldGroup.querySelectorAll('input, textarea, select');
      inputs.forEach(function (inp) { delete inp.__validationStarted; });
    });
  };
}

export function initFormValidation(scope) {
  scope = scope || document;
  var forms = scope.querySelectorAll('[data-form-validate]');
  if (!forms.length) return;

  forms.forEach(function (formContainer) {
    var destroy = setupForm(formContainer);
    if (destroy) cleanups.push(destroy);
  });
}

export function destroyFormValidation() {
  cleanups.forEach(function (fn) { fn(); });
  cleanups = [];
}
