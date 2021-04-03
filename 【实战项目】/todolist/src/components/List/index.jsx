import React, { Component } from "react";
import PropTypes from "prop-types";
import Item from "./Item";
import "./index.css";
export default class List extends Component {
  // state = {
  //   tolist: [],
  // };
  render() {
    return (
      <div className="todo-list">
        {this.props.todoList.map((value) => {
          return <Item key={value.id} todo={value} changeTodoStatus={this.props.changeTodoStatus} />;
        })}
      </div>
    );
  }
}

List.propTypes = {
  todoList: PropTypes.array,
  changeTodoStatus: PropTypes.func,
};
