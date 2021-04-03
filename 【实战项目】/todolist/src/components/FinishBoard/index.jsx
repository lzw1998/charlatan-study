import React, { Component } from "react";
import PropTypes from "prop-types";
import "./index.css";
import rightIcon from "../../assets/right.png";
import downIcon from "../../assets/down.png";

export default class FinishBoard extends Component {

  render() {
    const { isShowTodoFinishList } = this.props;
    return (
      <div
        className="todo-finish-tag"
        onClick={this.props.changeShow}
      >
        <img
          src={isShowTodoFinishList ? downIcon : rightIcon}
          alt="finish-list-icon"
        />
        <span className="finish-tag">
          已完成&nbsp;&nbsp;{this.props.finishNums}/{this.props.allNums}
        </span>
      </div>
    );
  }
}
FinishBoard.prototypes = {
  finishNums: PropTypes.number,
  allNums: PropTypes.number,
  isShowTodoFinishList: PropTypes.bool,
  changeShow:PropTypes.func
};
