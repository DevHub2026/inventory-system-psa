class User {
  final int id;
  final String? employeeNumber;
  final String username;
  final String firstName;
  final String? middleName;
  final String lastName;
  final String email;
  final String? status;
  final String? createdAt;
  final Department? department;
  final Office? office;
  final List<Role>? roles;

  User({
    required this.id,
    this.employeeNumber,
    required this.username,
    required this.firstName,
    this.middleName,
    required this.lastName,
    required this.email,
    this.status,
    this.createdAt,
    this.department,
    this.office,
    this.roles,
  });

  String get fullName => '$firstName $middleName $lastName'.trim();

  factory User.fromJson(Map<String, dynamic>
 json) {
    return User(
      id: json['id'] as int,
      employeeNumber: json['employee_number'] as String?,
      username: json['username'] as String,
      firstName: json['first_name'] as String,
      middleName: json['middle_name'] as String?,
      lastName: json['last_name'] as String,
      email: json['email'] as String,
      status: json['status'] as String?,
      createdAt: json['created_at'] as String?,
      department: json['department'] != null 
          ? Department.fromJson(json['department'] as Map<String, dynamic>) 
          : null,
      office: json['office'] != null 
          ? Office.fromJson(json['office'] as Map<String, dynamic>) 
          : null,
      roles: (json['roles'] as List<dynamic>?)
          ?.map((e) => Role.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'employee_number': employeeNumber,
      'username': username,
      'first_name': firstName,
      'middle_name': middleName,
      'last_name': lastName,
      'email': email,
      'status': status,
      'created_at': createdAt,
      'department': department?.toJson(),
      'office': office?.toJson(),
      'roles': roles?.map((e) => e.toJson()).toList(),
    };
  }
}

class Department {
  final int id;
  final String name;

  Department({
    required this.id,
    required this.name,
  });

  factory Department.fromJson(Map<String, dynamic> json) {
    return Department(
      id: json['id'] as int,
      name: json['name'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
    };
  }
}

class Office {
  final int id;
  final String name;

  Office({
    required this.id,
    required this.name,
  });

  factory Office.fromJson(Map<String, dynamic> json) {
    return Office(
      id: json['id'] as int,
      name: json['name'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
    };
  }
}

class Role {
  final int id;
  final String name;

  Role({
    required this.id,
    required this.name,
  });

  factory Role.fromJson(Map<String, dynamic> json) {
    return Role(
      id: json['id'] as int,
      name: json['name'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
    };
  }
}
