/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {mod} from '../../../src/core/math';
import {setImportantStyles, setStyle} from '../../../src/core/dom/style';

/**
 * @enum {number}
 */
export const Axis = {
  X: 0,
  Y: 1,
};

/**
 * @enum {string}
 */
export const Alignment = {
  START: 'start',
  CENTER: 'center',
};

/**
 * @typedef {{
 *   start: number,
 *   end: number,
 *   length: number,
 * }}
 */
let DimensionDef;

/**
 * @param {!Axis} axis The Axis to get the Dimension for.
 * @param {*} el The Element to get the Dimension For.
 * @return {!DimensionDef} The dimension for the Element along the given Axis.
 */
export function getDimension(axis, el) {
  const {bottom, height, left, right, top, width} =
    el./*OK*/ getBoundingClientRect();

  return {
    start: axis == Axis.X ? left : top,
    end: axis == Axis.X ? right : bottom,
    length: axis == Axis.X ? width : height,
  };
}

/**
 * @param {!Axis} axis The axis to get the center point for.
 * @param {!Element} el The Element to get the center point for.
 * @return {number} The center point.
 */
export function getCenter(axis, el) {
  const {end, start} = getDimension(axis, el);
  return (start + end) / 2;
}

/**
 * @param {!Axis} axis The axis to get the start point for.
 * @param {!Element} el The Element to get the start point for.
 * @return {number} The start point.
 */
export function getStart(axis, el) {
  const {start} = getDimension(axis, el);
  return start;
}

/**
 * @param {!Axis} axis The Axis to get the position for.
 * @param {!Alignment} alignment The Alignment to get the position for.
 * @param {!Element} el The Element to get the position for.
 * @return {number} The position for the given Element along the given axis for
 *    the given alignment.
 */
export function getPosition(axis, alignment, el) {
  return alignment == Alignment.START
    ? getStart(axis, el)
    : getCenter(axis, el);
}

/**
 * @param {!Axis} axis The axis along which to set the length.
 * @param {!Element} el The Element to set the length for.
 * @param {number} length The length value, in pixels, to set.
 */
export function updateLengthStyle(axis, el, length) {
  if (axis == Axis.X) {
    setStyle(el, 'width', `${length}px`);
  } else {
    setStyle(el, 'height', `${length}px`);
  }
}

/**
 * Sets a transform translate style for a given delta along a given axis.
 * @param {!Axis} axis The axis along which to translate.
 * @param {!Element} el The Element to translate.
 * @param {number} delta How much to move the Element.
 */
export function setTransformTranslateStyle(axis, el, delta) {
  const deltaX = axis == Axis.X ? delta : 0;
  const deltaY = axis == Axis.X ? 0 : delta;
  setStyle(el, 'transform', `translate(${deltaX}px, ${deltaY}px)`);
  // Set a custom property so that the slide itself can determine how to
  // translate the content if it so chooses.
  setImportantStyles(el, {
    '--content-transform': `translate(${deltaX}px, ${deltaY}px)`,
  });
}

/**
 * @param {!Axis} axis The axis to check for overlap.
 * @param {!Element} el The Element to check for overlap.
 * @param {number} position A position to check.
 * @return {boolean} If the element overlaps the position along the given axis.
 */
export function overlaps(axis, el, position) {
  const {end, start} = getDimension(axis, el);
  // Ignore the end point, since that is shared with the adjacent Element.
  return start <= position && position < end;
}

/**
 * @param {!Axis} axis The axis to align on.
 * @param {!Alignment} alignment The desired alignment.
 * @param {!Element} container The container to align against.
 * @param {!Element} el The Element get the offset for.
 * @return {number} How far el is from alignment, as a percentage of its length.
 */
export function getPercentageOffsetFromAlignment(
  axis,
  alignment,
  container,
  el
) {
  const elPos = getPosition(axis, alignment, el);
  const containerPos = getPosition(axis, alignment, container);
  const {length: elLength} = getDimension(axis, el);
  return (elPos - containerPos) / elLength;
}

/**
 * Finds the index of a child that overlaps a point within the parent,
 * determined by an axis and alignment. A startIndex is used to look at the
 * children that are more likely to overlap first.
 * @param {!Axis} axis The axis to look along.
 * @param {!Alignment} alignment The alignment to look for within the parent
 *    container.
 * @param {!Element} container  The parent container to look in.
 * @param {!Array<!Element>} children The children to look among.
 * @param {number} startIndex The index to start looking at.
 * @return {number|undefined} The overlapping index, if one exists.
 */
export function findOverlappingIndex(
  axis,
  alignment,
  container,
  children,
  startIndex
) {
  const pos = getPosition(axis, alignment, container);

  // First look at the start index, since is the most likely to overlap.
  if (overlaps(axis, children[startIndex], pos)) {
    return startIndex;
  }

  // Move outwards, since the closer indicies are more likely to overlap.
  for (let i = 1; i <= children.length / 2; i++) {
    const nextIndex = mod(startIndex + i, children.length);
    const prevIndex = mod(startIndex - i, children.length);

    if (overlaps(axis, children[nextIndex], pos)) {
      return nextIndex;
    }

    if (overlaps(axis, children[prevIndex], pos)) {
      return prevIndex;
    }
  }
}

/**
 * Gets the current scroll position for an element along a given axis.
 * @param {!Axis} axis The axis to set the scroll position for.
 * @param {!Element} el The Element to set the scroll position for.
 * @return {number} The scroll position.
 */
export function getScrollPosition(axis, el) {
  if (axis == Axis.X) {
    return el./*OK*/ scrollLeft;
  }

  return el./*OK*/ scrollTop;
}

/**
 * Sets the scroll position for an element along a given axis.
 * @param {!Axis} axis The axis to set the scroll position for.
 * @param {!Element} el The Element to set the scroll position for.
 * @param {number} position The scroll position.
 */
export function setScrollPosition(axis, el, position) {
  if (axis == Axis.X) {
    el./*OK*/ scrollLeft = position;
  } else {
    el./*OK*/ scrollTop = position;
  }
}

/**
 * Updates the scroll position for an element along a given axis.
 * @param {!Axis} axis The axis to set the scroll position for.
 * @param {!Element} el The Element to set the scroll position for.
 * @param {number} delta The scroll delta.
 */
export function updateScrollPosition(axis, el, delta) {
  setScrollPosition(axis, el, getScrollPosition(axis, el) + delta);
}

/**
 * Scrolls the position within a scrolling container to an Element. Unlike
 * `scrollIntoView`, this function does not scroll the container itself into
 * view.
 * @param {!Axis} axis The axis to scroll along.
 * @param {!Alignment} alignment How to align the element within the container.
 * @param {!Element} container The scrolling container.
 * @param {!Element} el The Element to scroll to.
 * @param {number} offset A percentage offset within the element to scroll to.
 */
export function scrollContainerToElement(
  axis,
  alignment,
  container,
  el,
  offset = 0
) {
  const startAligned = alignment == Alignment.START;
  const {length} = getDimension(axis, el);
  const snapOffset = startAligned ? getStart(axis, el) : getCenter(axis, el);
  const scrollOffset = startAligned
    ? getStart(axis, container)
    : getCenter(axis, container);
  const delta = snapOffset - scrollOffset - offset * length;

  updateScrollPosition(axis, container, delta);
}
