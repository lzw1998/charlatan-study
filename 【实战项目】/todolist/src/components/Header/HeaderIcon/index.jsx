import React, { Component } from "react";
import PropTypes from "prop-types";
import iconAdd from "../../../assets/add.png";
import iconCircle from "../../../assets/circle.png";
import "./index.css";

export default class HeaderIcon extends Component {
  render() {
    return (
      <div className="todo-header-icon">
        <img src={this.props.isFocused?iconCircle:iconAdd} alt="add" />
      </div>
    );
  }
}
HeaderIcon.propTypes={
  isFocused:PropTypes.bool
}