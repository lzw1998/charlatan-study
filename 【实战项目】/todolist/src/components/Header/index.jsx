import React, { Component } from "react";
import PropTypes from "prop-types";
import HeaderIcon from "./HeaderIcon";
import "./index.css";
import { genUuid } from "../../utils/uuid";

export default class Header extends Component {
  state = { newTodo: "", isFocused: false };

  inputNewTodo = (value) => {
    this.setState({ newTodo: value });
  };

  pressEnter = (code) => {
    if (code === "Enter") {
      this.props.pushTodoList({
        id: genUuid(),
        content: this.state.newTodo,
        isFinished: false,
      });
      this.setState({ newTodo: "" });
    }
  };

  render() {
    return (
      <div
        className="todo-header"
        onFocus={() => this.setState({ isFocused: true })}
        onBlur={() => this.setState({ isFocused: false })}
      >
        <HeaderIcon isFocused={this.state.isFocused} />
        <input
          value={this.state.newTodo}
          placeholder="添加任务"
          onChange={(e) => this.inputNewTodo(e.target.value)}
          onKeyDown={(e) => this.pressEnter(e.code)}
        />
      </div>
    );
  }
}
Header.propTypes = {
  pushTodoList: PropTypes.func,
};
