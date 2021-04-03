import React, { Component } from "react";
import PropTypes from "prop-types";
import iconChecked from "../../../assets/checked.png";
import iconUnchecked from "../../../assets/unchecked.png";
import "./index.css";

export default class Item extends Component {
  render() {
    const { id, isFinished, content } = this.props.todo;
    return (
      <div
        id={`item-${id}`}
        className="todo-list-item"
        onClick={() => this.props.changeTodoStatus(id,isFinished)}
      >
        <div className="item-icon">
          <img src={isFinished ? iconChecked : iconUnchecked} alt="item" />
        </div>
        <div className={`item-content ${isFinished ? "todoFinished" : ""}`}>
          {content}
        </div>
      </div>
    );
  }
}
Item.propTypes = {
  changeTodoStatus: PropTypes.func,
};
